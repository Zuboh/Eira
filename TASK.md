# TASK — Eira

Checklist di sviluppo. Piano/scadenze/contesto narrativo → vault
`wiki/Projects/Tesi-Consegne-Infermieristiche.md`. Qui solo cose da
fare sul codice.

## 🔴 Bug bloccante

- [x] `core/security.py` — `hash_password` rotto: passlib 1.7.4 +
      bcrypt 5.0.0 incompatibili (`password cannot be longer than 72
      bytes` su qualsiasi input). Blocca login/creazione utenti.
      Fix: rimosso passlib, `bcrypt` diretto (passlib inadatto,
      nessuna release supporta bcrypt 5.x).

## Backend — persistenza DB reale

Router `auth.py`, `turni.py`, `banca_ore.py` fatti (login JWT, CRUD
turni/assegnazioni con validazioni, calcolo saldo ore). Restano stub
puri (dati finti, nessuna query DB):

- [x] `utenti.py` — create/list/update utente (DB reale, password hash, scoping reparto su create/list/get/update; test in `tests/test_utenti.py`)
- [x] `pazienti.py` — create/list/get/update paziente (DB reale, scoping reparto; test in `tests/test_pazienti.py`)
- [x] `consegne_sbar.py` — create/list/update consegna SBAR (DB reale; create richiede assegnazione attiva al turno + paziente/turno stesso reparto; list scoping infermiere=propri turni assegnati / caposala=tutto il reparto; update solo autrice; test in `tests/test_consegne_sbar.py`)
- [x] `diario_cedema.py` — create/list voce diario CEDEMA (scoping reparto via paziente + turno_id opzionale verificato stesso reparto); test in `tests/test_diario_cedema.py`
- [x] `valutazioni.py` — create/list Norton + Conley (scoping reparto via paziente, punteggio_totale calcolato server-side); aggregate `/{paziente_id}/valutazioni` dashboard multidimensionale; test in `tests/test_valutazioni.py`
- [x] `cambi_turno.py` — flusso doppia conferma (collega → caposala): stati `in_attesa_collega → in_attesa_caposala → approvata` (swap `infermiere_id` su assegnazione esistente) o `rifiutata_collega`/`rifiutata_caposala`; riusa check niente-doppio-turno su approvazione; test in `tests/test_cambi_turno.py`

**Audit IDOR post-completamento router (2026-07-09):** grep mirato su `reparto_id`/`infermiere_id` in tutti i router. Trovata 4a occorrenza classe bug: `banca_ore.py` `GET /{infermiere_id}` non verificava reparto caposala vs reparto infermiere (qualsiasi caposala poteva leggere banca ore di reparto altrui). Fix + test in `tests/test_banca_ore.py` (33 test totali passano).

## Feature core (da requisiti progetto)

- [ ] Priorità urgenza su consegna SBAR (`priorità: normale|urgente`) — campo già in schema? verificare
- [ ] Dashboard caposala: turni scoperti + richieste cambio turno in attesa (badge/lista in-app)
- [ ] Scoping ruolo: infermiere vede solo pazienti/consegne del proprio turno assegnato (oggi query non filtrano per turno, solo per reparto)

## Frontend

- [ ] Route guard (`router/index.ts`) — verificare blocchi davvero non autenticati, non solo skeleton
- [ ] `LoginView` → collegare a `POST /auth/token` reale (bloccato da bug hash sopra per test end-to-end)
- [ ] Dashboard infermiere — collegare a dati reali (`mie-assegnazioni`, consegne, CEDEMA)
- [ ] Dashboard caposala — calendario turni, assegnazione, scoperti, cambi turno in attesa
- [ ] Vista consegna SBAR (form + lettura)
- [ ] Vista valutazioni Norton/Conley (dashboard multidimensionale per paziente)
- [ ] Vista cambio turno (richiesta + risposta collega + approvazione caposala)
- [ ] Vista banca ore (saldo mensile infermiere)
- [ ] Applicare branding da `docs/DESIGN.md` (Google Stitch) — style.css ha `--logo-accent` non ancora usato in componenti

## Diagrammi / documentazione tesi

- [x] ER/UML in draw.io (`docs/diagrams/er-consegne-infermieristiche.drawio`) — 11 entità, relazioni complete (aggiunte 2 mancanti: autore_id su Norton/Conley), validato
- [x] Export PNG del diagramma per report (`docs/diagrams/er-consegne-infermieristiche.drawio.png`)
- [ ] Swagger/OpenAPI (`/docs`) — verificare copertura tutte le entità una volta router reali

## Test funzionale (deliverable traccia, no unit test richiesti)

- [ ] Screenshot flussi principali per report (login, dashboard, consegna SBAR, cambio turno, banca ore)

## Report (Parte Prima + Seconda, template Pegaso)

- [ ] Parte Prima: conoscenze/abilità, fasi+tempi, risorse/strumenti (citare alternativa Kotlin+Ktor scartata)
- [ ] Parte Seconda: obiettivi, contesto Poliambulanza-ispirato, UML/ER/API, valutazione risultati
- [ ] Passare sezioni narrative da skill `humanizer` prima di consegna (vedi nota AI-detection in vault)

## Video walkthrough (collaterale, post sett.6 — primo taglio se nucleo slitta)

- [ ] Screen recording app reale (Playwright MCP o recorder nativo)
- [ ] `design-md` storyboard overlay → `stitch-design-taste` → `hyperframes-animation` GSAP → `remotion-best-practices` composizione finale

## Review per fase (self-check)

Checkpoint manuale — spuntare solo dopo review effettiva del lavoro
della fase, non a fine settimana per default. Fasi da piano vault
(`Tesi-Consegne-Infermieristiche.md`).

- [x] Sett.1 — Design (ER/UML, contratto API, scaffold)
- [ ] Sett.2-3 — Backend (modelli, auth JWT, CRUD consegne/turni/pazienti)
- [ ] Sett.4-5 — Frontend (login, dashboard infermiere/caposala)
- [ ] Sett.6 — Integrazione, test funzionale, screenshot
- [ ] Sett.7 — Report (Parte Prima + Seconda)

## Note

- Commit incrementali e datati durante tutta la stesura (evidenza
  autorialità contro controlli retroattivi Turnitin — v. vault).
- Cutline se nucleo in ritardo: 1) video walkthrough, 2) stretch
  (vitali mock, notifiche), 3) feature extra (cambio turno/banca
  ore/priorità). Nucleo (ruoli, dashboard turni, consegne SBAR) non si taglia mai.
