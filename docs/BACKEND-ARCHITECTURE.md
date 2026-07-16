# Backend Architecture

Questo è il documento canonico da seguire quando si aggiungono o modificano endpoint FastAPI, modelli, schema o regole di dominio backend.

## Principio guida

> **Router sottili ma espliciti, schema Pydantic per confini API, modelli SQLAlchemy per persistenza, dependency per auth/DB/ruoli.**

Il backend oggi è un'app FastAPI monolitica modulare. Non ci sono service layer separati per ogni dominio: la logica è prevalentemente nei router. Quando una regola cresce o viene riusata, estrarla in helper privato del router o in modulo dedicato.

## Struttura backend

```txt
backend/app/
  main.py              # app FastAPI, middleware, routers, seed dev data
  deps.py              # DB session, current user, role dependencies
  openapi_errors.py    # helper risposte errore OpenAPI
  core/
    config.py          # settings
    database.py        # engine, SessionLocal, Base
    security.py        # password/JWT/temp password helpers
    rate_limit.py      # limiter slowapi
    login_attempts.py  # backoff/rate state login
  models/              # SQLAlchemy ORM models + enums
  schemas/             # Pydantic request/response schemas
  routers/             # API endpoints per dominio
```

## Layer e responsabilità

### `main.py`

Responsabilità:

- creare `FastAPI` app;
- configurare CORS;
- collegare rate limiter;
- registrare routers con prefisso `/api/v1`;
- creare metadata DB e seed dati dev in startup;
- esporre `/health`.

Non aggiungere business logic endpoint in `main.py`.

### `deps.py`

Responsabilità:

- `get_db()` e `DbDep`;
- `get_current_user()` e `CurrentUserDep`;
- `require_roles(...)`.

Ogni endpoint protetto deve usare `CurrentUserDep` o dependency ruolo. Non decodificare token nei router.

### `models/`

Responsabilità:

- tabelle SQLAlchemy;
- colonne, foreign key, default semplici;
- enum persistiti.

Regole:

- importare tutti i modelli tramite `app.models` per registrare `Base.metadata`;
- non inserire logica API nei model;
- mantenere naming coerente con tabelle esistenti;
- per nuovi enum usare `models/enums.py`.

### `schemas/`

Responsabilità:

- request DTO (`Create`, `Update`, request action);
- response DTO (`Read`, aggregate response);
- `model_config = {"from_attributes": True}` sui read schema ORM-backed.

Regole:

- non ritornare ORM model direttamente come contratto pubblico;
- creare schema separati per create/update/read;
- update schema deve usare campi opzionali quando PATCH parziale;
- response aggregate dedicate quando l'endpoint compone più dataset.

### `routers/`

Responsabilità:

- definire endpoint;
- applicare auth/role guard;
- validare ownership/reparto;
- orchestrare query/mutation DB;
- ritornare schema Pydantic;
- dichiarare risposte errore OpenAPI.

Pattern endpoint:

```py
@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(RuoloUtente.caposala))],
    responses=errors(UNAUTHORIZED, FORBIDDEN),
)
def create_entity(payload: EntityCreate, current_user: CurrentUserDep, db: DbDep) -> EntityRead:
    ...
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return EntityRead.model_validate(entity)
```

## Auth, ruoli e ownership

Ruoli principali:

- `infermiere`
- `caposala`

Regole:

- usare `CurrentUserDep` per endpoint autenticati;
- usare `Depends(require_roles(...))` per endpoint role-specific;
- controllare sempre `reparto_id` quando una risorsa è legata al reparto;
- infermiere può consultare solo risorse consentite dal suo contesto;
- caposala può gestire solo risorse del proprio reparto.

Esempi già presenti:

- pazienti: caposala crea/modifica; infermiere vede solo se ha turno attivo;
- banca ore: infermiere solo propria, caposala solo infermieri proprio reparto;
- cambio turno: doppia conferma collega + caposala.

## Error handling e OpenAPI

Usare `app.openapi_errors.errors(...)` per documentare errori attesi:

```py
responses=errors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, BAD_REQUEST)
```

Status code policy:

- `201 Created` per create;
- `204 No Content` per delete senza body;
- `400` input semanticamente invalido;
- `401` auth mancante/non valida;
- `403` ruolo/ownership/reparto non autorizzato;
- `404` risorsa non trovata;
- `409` conflitto di stato o unicità;
- `422` validation Pydantic/FastAPI.

## DB session e transazioni

- Usare `DbDep` in endpoint.
- Fare `db.add(...)`, `db.commit()`, `db.refresh(...)` per create/update.
- Per mutation multi-step, validare tutto prima del commit quando possibile.
- Non creare session manuali nei router: solo dependency.
- Seed dev è eccezione confinata a `main.py`.

## Sicurezza

Regole obbligatorie:

- password sempre con `hash_password` / `verify_password`;
- token solo con `create_access_token`;
- non loggare password, temporary password o JWT;
- mantenere warning su JWT secret di default;
- rate limit/backoff auth deve restare nel router auth/core dedicato;
- nessun endpoint deve fidarsi di `reparto_id` client se può derivarlo da `current_user`.

Esempio importante: `create_paziente` ignora `payload.reparto_id` e usa `current_user.reparto_id`.

## Domain rules rilevanti

### Cambio turno

Flusso:

1. infermiere crea richiesta su propria assegnazione attiva;
2. collega accetta/rifiuta;
3. caposala approva/rifiuta;
4. se approvata, assegnazione passa al collega;
5. evitare doppio turno nella stessa data.

Stati in `StatoCambioTurno`.

### Banca ore

- Calcolo mensile: ore pianificate da assegnazioni attive meno ore contrattuali del profilo infermiere.
- Turni notturni che superano mezzanotte devono sommare un giorno alla fine.
- `mese` richiesto come `YYYY-MM`.

### Pazienti

- Appartenenza sempre per reparto.
- Infermiere senza turno attivo non vede pazienti.
- Dimissione gestita con `dimesso` su update caposala.

### Valutazioni / diario clinico

- Create/read sono patient-scoped.
- Controllare sempre paziente e reparto.
- Response deve usare schema read, non model ORM grezzo.

## Quando estrarre service/helper

Estrarre da router se:

- la stessa regola è usata in più endpoint;
- un endpoint supera chiaramente responsabilità di request handling;
- serve testare una funzione pura di dominio;
- il calcolo non dipende direttamente da FastAPI.

Destinazioni consigliate:

```txt
app/services/<domain>.py     # workflow dominio riusabile
app/domain/<domain>.py       # funzioni pure/regole se introdotto in futuro
```

Non introdurre service layer per forza su endpoint semplici: preferire refactor incrementale.

## Test e verifica

Comando backend standard:

```bash
cd backend
PYTHONPATH=. uv run pytest
```

Per modifiche backend:

- aggiungere/aggiornare test quando cambia comportamento;
- verificare OpenAPI se cambia contratto endpoint;
- controllare status code e response schema;
- controllare ruoli/ownership/reparto;
- se cambia auth/security, includere review sicurezza.

## Checklist per agenti prima di completare backend

- [ ] Endpoint protetto usa `CurrentUserDep`?
- [ ] Ruolo richiesto via `require_roles` dove necessario?
- [ ] Ownership/reparto controllati?
- [ ] Input/output passano da schema Pydantic?
- [ ] Nessun dato sensibile loggato o ritornato?
- [ ] Errori attesi documentati con `errors(...)`?
- [ ] Status code coerente?
- [ ] Commit DB e refresh corretti?
- [ ] Test backend passati o motivazione chiara se non eseguiti?

## Cosa evitare

- Business logic in `main.py`.
- Decodifica JWT nei router.
- Uso di `payload.reparto_id` quando la sorgente autorevole è `current_user.reparto_id`.
- Ritornare model ORM direttamente come contratto pubblico.
- Duplicare regole di cambio turno/banca ore in più router senza helper.
- Aggiungere dipendenze backend senza reale necessità.
