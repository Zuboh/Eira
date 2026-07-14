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

Sett.2-5 in corso (piano Pegaso in `TASK.md`).

- **Backend**: tutti i router su persistenza reale — auth JWT, utenti,
  pazienti, turni/assegnazioni, consegne SBAR, valutazioni
  Norton/Conley, diario CEDEMA, cambi turno (doppia conferma
  collega→caposala), banca ore, dashboard caposala. Audit IDOR fatto
  (4 occorrenze trovate e fixate). Seed automatico di reparti,
  caposala e infermiere di sviluppo — senza un caposala, nessun utente
  potrebbe mai creare personale/reparti.
  33+ test in `backend/tests/`.
- **Frontend**: login (tile-picker dispositivo/reparto), registrazione
  con approvazione caposala, gestione personale fatti. Dashboard
  infermiere/caposala e viste operative (SBAR, valutazioni, cambio
  turno, banca ore) ancora da collegare a dati reali.
- **Bug noti aperti** (dettagli in `TASK.md`): crash su
  `DELETE /turni/{id}/assegnazioni` con richieste cambio turno
  pendenti; test suite tocca il DB SQLite reale su disco invece di
  restare isolata in-memory.

Checklist completa, per-router → `TASK.md`. Setup dettagliato (env,
DB, note migrazioni) → `docs/SETUP.md`.

## Avvio

```bash
./dev.sh
```

Avvia backend (`:8000`) + frontend (`:5173`) insieme, liberando le
porte se occupate. All'avvio assicura i reparti di sviluppo, un
caposala e un infermiere attivi (id di login stampati nel log come
`[seed] ...`; password nei setting `seed_*_password`).

Manuale:

- Backend: `cd backend && uv run fastapi dev`
- Frontend: `cd frontend && npm run dev`
