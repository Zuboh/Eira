# Setup — Eira

## Prerequisiti

- Python 3.12 e `uv` (`backend/.python-version`, `backend/uv.lock`).
- Node 22 dalla `.nvmrc` e npm 10+.

```bash
nvm use
cd backend && uv sync --locked
cd ../frontend && npm ci
```

## Backend e database

La configurazione viene letta da `backend/.env`. Partire dall'esempio:

```bash
cd backend
cp .env.example .env
uv run python -m app.cli.db bootstrap
uv run fastapi dev --port 8000
```

`bootstrap` è il punto di ingresso non distruttivo per Alembic:

- un DB vuoto viene creato e portato a `head`;
- un DB preesistente identico alla baseline viene versionato senza perdere dati;
- uno schema inatteso viene rifiutato senza essere marcato come valido;
- un DB già versionato riceve gli upgrade pendenti.

Prima di migrare dati importanti fare comunque una copia del file SQLite.
Anche in produzione usare `uv run python -m app.cli.db bootstrap` come comando
canonico del deploy: adotta in sicurezza il primo database pre-Alembic e
aggiorna quelli già versionati. `upgrade` è disponibile solo per database che
contengono già `alembic_version` e rifiuta gli altri senza modificarli. Entrambi
usano `DATABASE_URL`; l'app non applica migrazioni automaticamente.

Il seed crea reparti e account dimostrativi solo in development/E2E quando
`SEED_ENABLED=true`. È sempre disabilitato in production. Le origini CORS
sono configurabili con `CORS_ORIGINS` e non devono contenere `*`.

## Frontend

```bash
cd frontend
cp .env.example .env  # opzionale in locale
npm run dev            # http://localhost:5173
```

Il client HTTP è `src/api/eiraClient.ts`; i wrapper in `src/api` usano i
tipi generati da `src/api/schema.d.ts`. Non introdurre Axios.

## Avvio congiunto

Dalla root:

```bash
./dev.sh
```

Lo script prepara lo schema tramite il bootstrap e avvia backend `:8000` e
frontend `:5173`. Libera preventivamente quelle porte, quindi non usarlo se
su tali porte girano processi da preservare.

## Verifica

```bash
cd backend
PYTHONPATH=. uv run pytest
uv run ruff check .

cd ../frontend
npm run lint
npm run format:check
npm run test
npm run typecheck
npm run build
npm run openapi:check
npm run test:e2e
```

Playwright usa porte dedicate `8001/5174` e un `e2e.db` temporaneo ricreato
per ogni suite. I test Python usano app e database in-memory isolati e non
avviano seed o lifecycle del database di sviluppo.
