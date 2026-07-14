# Setup — Eira

Guida pratica per avviare il progetto in locale. Stack: FastAPI + SQLite
(backend), Vue 3 + Vite (frontend), JWT (`OAuth2PasswordBearer`).

## 1. Prerequisiti

- **Python 3.12+** — `pyproject.toml` fissa `requires-python = ">=3.12"`,
  `.python-version` in `backend/` è `3.12`.
- **uv** — package manager del backend (`uv.lock` committato, niente
  pip/poetry). Install: `curl -LsSf https://astral.sh/uv/install.sh | sh`
  oppure `brew install uv`.
- **Node.js** — nessuna versione pinnata nel repo (`frontend/package.json`
  non ha campo `engines`); sviluppato/testato con Node 22.
- **npm** — bundlato con Node.

## 2. Backend

```bash
cd backend
uv sync
```

`uv sync` installa le dipendenze da `pyproject.toml`/`uv.lock` in un
`.venv` locale, incluso il gruppo dev (`pytest`).

### Variabili d'ambiente

`app/core/config.py` legge da un file `.env` in `backend/` (via
`pydantic-settings`, `env_file=".env"`, `extra="ignore"`). **Non esiste
ancora un `.env.example` in `backend/`** — da creare con queste chiavi
(nomi e default reali presi dal codice):

| Variabile | Default | Note |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./consegne_infermieristiche.db` | path relativo alla cwd da cui parte il processo |
| `JWT_SECRET_KEY` | `dev-secret-change-in-production` | placeholder insicuro — sovrascrivere sempre fuori da locale |
| `JWT_ALGORITHM` | `HS256` | |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | `480` (8h) | |
| `SEED_REPARTO_NOME` | `Medicina Generale e Geriatria` | reparto principale creato/assicurato allo startup |
| `SEED_SECONDO_REPARTO_NOME` | `Chirurgia Generale` | secondo reparto di sviluppo creato/assicurato allo startup |
| `SEED_CAPOSALA_PASSWORD` | `dev-caposala-change-in-production` | password del caposala seed |
| `SEED_INFERMIERE_EMAIL` | `infermiere@eira.local` | email stabile dell'infermiere seed |
| `SEED_INFERMIERE_PASSWORD` | `dev-infermiere-change-in-production` | password dell'infermiere seed |

Per lo sviluppo locale i default bastano così come sono: nessun `.env`
è strettamente necessario per far partire l'app, serve solo per fare
override (es. secret key reale fuori da locale).

### Avvio

```bash
cd backend && fastapi dev
```

Il CLI `fastapi` viene dall'extra `fastapi[standard]`. `fastapi dev`
gira con reload automatico su `http://localhost:8000` — Swagger UI su
`/docs`.

### Test

```bash
cd backend && uv run pytest
```

Vedi la sezione 4 per un bug noto legato a come i test interagiscono
col database.

## 3. Frontend

```bash
cd frontend
npm install
```

### Variabili d'ambiente

Vite legge env var con prefisso `VITE_`. Il repo ha già
`frontend/.env.example`:

```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Copiarlo in `.env` è opzionale in locale — `src/api/client.ts` usa lo
stesso valore come fallback (`import.meta.env.VITE_API_BASE_URL ??
'http://localhost:8000/api/v1'`) se la variabile manca.

```bash
cp .env.example .env  # opzionale, default già allineato
```

### Avvio

```bash
cd frontend && npm run dev      # Vite dev server, http://localhost:5173
npm run build                    # vue-tsc -b (type-check) + vite build
npm run preview                  # serve la build di produzione in locale
```

## 4. Database

SQLite, singolo file: `backend/consegne_infermieristiche.db`. Il path
in `DATABASE_URL` è relativo alla cwd del processo — lanciare `fastapi
dev` da dentro `backend/` (come in sezione 2) tiene il file lì.

**Nessun sistema di migrazioni**: niente Alembic nel repo (confermato —
nessuna cartella `alembic/` in tutto il progetto). Lo schema si
crea/aggiorna così:

- `app/main.py`, evento `startup`, chiama
  `Base.metadata.create_all(bind=engine)` — crea le tabelle mancanti
  sull'engine di produzione ogni volta che l'app parte.
- Lo stesso startup assicura dati minimi di sviluppo in modo
  idempotente: i due reparti configurati, almeno un caposala attivo e
  l'infermiere seed attivo. Gli id da usare come username vengono
  stampati nel log `[seed] ...`.
- `create_all` è **additivo soltanto**: non altera colonne esistenti,
  non gestisce drop/rename. Se cambi un modello (es. aggiungi una
  colonna a una tabella già creata), l'unico modo per vedere lo schema
  aggiornato in locale è cancellare `consegne_infermieristiche.db` e
  far ripartire l'app.

**Bug noto, non ancora fixato** (vedi `TASK.md`): la stessa startup
routine gira anche quando lanci i test. `tests/conftest.py` monta
`TestClient(app)`, che fa scattare l'evento `startup` dell'app reale.
I test usano un secondo engine SQLite in-memory per le query effettive
(override della dependency `get_db`), ma `create_all(bind=engine)`
nello startup punta comunque all'engine di produzione — quindi **ogni
run di pytest crea/tocca anche il file `.db` reale su disco**, non
solo il DB in-memory isolato dei test. Non è una feature, è un bug
aperto: non aspettarti isolamento test/dev sul filesystem finché non
viene fixato.
