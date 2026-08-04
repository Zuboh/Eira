# Eira — Consegne Infermieristiche

Project work finale — CdS Informatica per Aziende Digitali (Pegaso).
App full-stack per la gestione digitale delle consegne infermieristiche
(shift handover) con metodo **SBAR/ISBAR**, ispirata al contesto
U.O. Medicina Generale e Geriatria (fittizio, nessuna partnership reale).

## Stack

- **Backend**: Python + FastAPI + SQLite, JWT (OAuth2PasswordBearer)
- **Frontend**: Vue 3 + Vite + TypeScript, Pinia, PrimeVue
- **Diagrammi**: draw.io (ER/UML)

## Stato

Il flusso applicativo è collegato end-to-end a persistenza reale:
autenticazione e gestione personale, pazienti, turni e assegnazioni,
dashboard per ruolo, consegne SBAR/CEDEMA, parametri vitali,
valutazioni Norton/Conley, cambi turno, ferie, banca ore e carrello
farmaci.

Il frontend usa tipi generati dall'OpenAPI del backend e mantiene la
logica di autorizzazione sul server. La baseline di qualità comprende
Ruff/pytest, ESLint/Prettier/Vitest/typecheck/build, controllo del
contratto OpenAPI e flussi Playwright con axe-core. I risultati correnti
si ottengono dai comandi sotto e dalla CI, evitando conteggi hardcoded.

Checklist completa, per-router → `TASK.md`. Indice documentazione →
`docs/README.md`. Setup dettagliato (env, DB, note migrazioni) →
`docs/SETUP.md`.

## Avvio

```bash
./dev.sh
```

Avvia backend (`:8000`) + frontend (`:5173`) insieme, liberando le
porte se occupate. Il seed è riservato agli ambienti di sviluppo/E2E;
non viene eseguito in produzione.

Manuale:

- Backend: `cd backend && uv run python -m app.cli.db bootstrap && uv run fastapi dev`
- Frontend: `cd frontend && npm run dev`

## Verifica

```bash
cd backend && PYTHONPATH=. uv run pytest && uv run ruff check .
cd ../frontend && npm run lint && npm run format:check
npm run test && npm run typecheck && npm run build
npm run openapi:check
npm run test:e2e
```
