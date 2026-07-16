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
- [x] DB vuoto → app inutilizzabile: nessun endpoint crea `reparto`,
      `POST /auth/register` crea solo `infermiere` in `in_attesa`, ogni
      mutazione richiede `require_roles(caposala)` — nessun percorso
      legale verso un primo utente. Fix: `main.py:_seed_dev_data`
      su startup, idempotente (check by role, non by table-empty) —
      garantisce reparti (`seed_reparto_nome`,
      `seed_secondo_reparto_nome`), un caposala e un infermiere attivi
      con `ProfiloInfermiere`; id/credenziali in `.env`
      (`seed_*_password`), stampati in log `[seed] ...` all'avvio.

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

- [ ] **Parametri vitali** (stretch/mock, v. Note) — nuova entità `ParametriVitali`, stesso pattern di `diario_cedema.py` (paziente-scoped, `turno_id` opzionale verificato stesso reparto, `autore_id`, `timestamp`):
  - `temperatura` (°C), `frequenza_cardiaca` (bpm), `pressione_sistolica`/`pressione_diastolica` (mmHg), `frequenza_respiratoria` (atti/min), `saturazione_o2` (%)
  - `stato_coscienza`: nuovo enum AVPU `StatoCoscienza` — `vigile | verbale | dolore | coma`
  - `ossigeno`: bool (ossigenoterapia in corso)
  - `note` (opzionale)
  - Router `POST/GET /pazienti/{paziente_id}/parametri-vitali`, no validazioni di range/allarme clinico (scope creep per uno stretch goal)
- [x] Priorità urgenza su consegna SBAR (`priorità: normale|urgente`) — già presente in modello/schema/create/update/read, nessuna azione necessaria
- [x] Dashboard caposala: turni scoperti + richieste cambio turno in attesa (`GET /dashboard/caposala`, aggregato con count; test in `tests/test_dashboard.py`)
- [x] Scoping ruolo: infermiere vede pazienti reparto solo se ha almeno un'assegnazione turno attiva (gate, non filtro per turno specifico — pazienti non hanno turno_id); consegne_sbar già turno-scoped correttamente; test in `tests/test_pazienti.py`

## Backend — findings code review (2026-07-11, non ancora fixati)

Review via 2 agenti `feature-dev:code-reviewer` paralleli (auth/routing +
data/schema layer). Solo review, nessun fix applicato.

- [ ] 🔴 Crash: `DELETE /turni/{id}/assegnazioni` non controlla
      `RichiestaCambioTurno` pendenti che referenziano l'assegnazione
      cancellata → `risposta-caposala` successivo crasha con
      `AttributeError` non gestito (`turni.py:115-130`,
      `cambi_turno.py:129-131`). No FK `ondelete`, no
      `PRAGMA foreign_keys=ON`.
- [ ] 🔴 Test suite triggera `Base.metadata.create_all` sull'engine di
      produzione (file `.db` reale su disco) ad ogni run, non solo su
      DB in-memory isolato (`main.py:33-35`, `core/database.py:7`,
      `tests/conftest.py`).
- [ ] 🟡 `StatoAssegnazione.cambiata` enum mai assegnato — flusso swap
      turno (`cambi_turno.py:157`) muta `infermiere_id` in place senza
      mai marcare `cambiata`.
- [ ] 🟡 Gate "turno attivo" su pazienti non è time-scoped — una
      singola assegnazione passata/futura/altro-reparto basta per
      sempre (combinato col punto sopra). Scelta esplicita utente via
      AskUserQuestion: gate su assegnazione attiva, non su turno di
      oggi — se si rivede, serve filtro su `Turno.data` in
      `_infermiere_ha_turno_attivo` (`pazienti.py`). Test nuovo non
      distingue implementazione corretta da bug (usa solo turno di
      oggi).

Ordine suggerito: 🔴 prima (concreti), 🟡 dopo (richiedono decisione
design su semantica "turno attivo").

## Frontend

- [x] Route guard (`router/index.ts`) — reale: redirect non-autenticati a `/login`, `fetchMe` con fallback logout, redirect per ruolo
- [x] `LoginView` → collegato a `POST /auth/token` reale via `stores/auth.ts` + `api/auth.ts` (bug hash sopra fixato)
- [x] Dashboard infermiere — collegare a dati reali (turni via `mie-assegnazioni`, consegne SBAR, pazienti in carico) — `DashboardView.vue`, verificata end-to-end. CEDEMA non aggregato: nessun endpoint cross-paziente, resta accessibile per singolo paziente da `SchedaPazienteView`
- [x] Dashboard caposala — calendario turni, assegnazione, scoperti, cambi turno in attesa — nuovo endpoint `GET /turni/calendario`, verificata end-to-end (assegna turno scoperto, approva/rifiuta cambio turno)
- [x] Vista consegna SBAR (form + lettura) — `ConsegneSbarView.vue`, verificata end-to-end
- [x] Vista valutazioni Norton/Conley (dashboard multidimensionale per paziente) — tab in `SchedaPazienteView.vue`, non ancora verificata end-to-end (creazione CEDEMA/Norton/Conley)
- [x] Vista cambio turno (richiesta + risposta collega + approvazione caposala) — `CambioTurnoView.vue`, non ancora verificata end-to-end (serve secondo account infermiere)
- [x] Vista banca ore (saldo mensile infermiere) — `BancaOreView.vue`, non ancora verificata end-to-end (solo code review)
- [x] Applicare branding da `docs/DESIGN.md` (Google Stitch) — verificato:
      non serve `--logo-accent`; il design system usa `--color-primary`
      come unico accent swappabile.

### Frontend — architecture review (2026-07-14)

Report visuale generato in
`/private/var/folders/vw/wn7n954d21l5pwb74s8cwmj80000gn/T/architecture-review-20260714-155636.html`
(file temp, non repo). Candidati di deepening:

- [ ] **Eira data-fetching module** — riallineare frontend ad ADR-0003:
      sostituire axios/manual types con `openapi-fetch` +
      `openapi-typescript`; concentrare auth headers, 401 policy,
      response shape ed error mapping dietro un'unica interfaccia.
      Top recommendation.
- [ ] **Reparto access module** — estrarre da `LoginView.vue` il flusso
      reparto dispositivo → tile utente → login → cambio password
      temporanea; lasciare alla view solo presentazione/focus.
- [ ] **Caposala staff workflow module** — concentrare caricamento
      personale, filtri stato, approvazione utenti, reset password
      temporanea e pending count riusato dalla dashboard.
- [ ] **Session module** (speculativo) — se auth/ruoli crescono,
      concentrare token persistence, hydration, 401 e landing route per
      ruolo fuori da router/store/client sparsi.

### Frontend — code refactor plan (2026-07-16)

Piano operativo scritto in `docs/FRONTEND-CODE-REFACTOR.md`. Obiettivo:
ridurre debito architetturale senza bloccare la demo, con fasi
incrementali sempre compilabili.

- [ ] **Fase 0 — baseline/guardrail**: script `typecheck`, README
      frontend reale, pulizia file OS, build sempre verde.
- [ ] **Fase 1 — quick wins accessibilità/performance**: link
      accessibili nelle tabelle, doppio fetch banca ore, aria-label su
      icon button, wrapper responsive per tabelle larghe, lookup
      computed nel calendario caposala.
- [x] **Fase 2 — mini UI layer**: `PageHeader`, `InlineError`,
      `EmptyState`, `EiraTable`, `FormField`, `EiraCard`.
- [x] **Fase 3 — session/routing espliciti**: route metadata ruoli,
      landing route per ruolo, nav derivata da config condivisa,
      session status esplicito.
- [x] **Fase 4 — OpenAPI data-fetching module**: allineare ad
      ADR-0003 (`openapi-typescript` + `openapi-fetch`), poi rimuovere
      axios se non resta usato.
- [x] **Fase 5 — feature composables**: sgonfiare `LoginView`,
      `SchedaPazienteView`, cambio turno, staff workflow.
- [x] **Fase 6 — over-fetch reduction**: dashboard/scheda paziente con
      query dedicate o mappe computed e fetch paralleli/cancellabili.
- [x] **Fase 7 — token/responsive governance**: allineare
      `docs/DESIGN.md`, `style.css`, PrimeVue preset e AppShell mobile.

Avvio implementazione:

- [x] Aggiunto script `frontend` `typecheck`.
- [x] `PazientiView`: riga cliccabile sostituita con `RouterLink`
      accessibile + wrapper tabella con overflow interno.
- [x] `BancaOreView`: evitato doppio fetch iniziale caposala.
- [x] `BancaOreView`: aggiunti `aria-label` ai bottoni mese
      precedente/successivo.
- [x] `SchedaPazienteView`: aggiunti wrapper responsive alle tabelle
      CEDEMA, Norton, Conley e storico SBAR.
- [x] `ConsegneSbarView`: aggiunto wrapper responsive alla tabella
      consegne.
- [x] `DashboardView` caposala: normalizzato calendario in computed
      `righeCalendario` ed evitati lookup `.find()` ripetuti nel
      render loop.
- [x] `DashboardView` infermiere: lookup pazienti/turni spostati in
      `computed Map`, stato locale ridotto a consegne recenti e pazienti
      attivi mostrati dalla UI.
- [x] `ConsegneSbarView`: lookup pazienti in `computed Map`; turni
      assegnati caricati solo quando si apre il dialog nuova consegna.
- [x] `SchedaPazienteView`: storico SBAR caricato lazy solo quando si
      apre la tab, in attesa di endpoint paziente-dedicato.
- [x] Fase 7: aggiunti token spacing/layout/dialog/on-color in
      `style.css`, `AppShell` responsive tablet/mobile, dialog sizing
      governato da helper condiviso, rimossi raw `#fff`/fallback
      primary dalle view.
- [x] Polish UI primitives: `CambioTurnoView` e `StaffView` migrati a
      `PageHeader`, `EiraTable`, `InlineError` e, dove utile,
      `FormField`, riducendo CSS tabella/form duplicato.
- [x] Polish UI primitives: `ConsegneSbarView`, dashboard infermiere e
      tab cliniche paziente migrati a `EiraTable`/`EiraCard`/`PageHeader`
      dove applicabile, rimuovendo wrapper tabella locali.
- [x] Vue best practices: aggiunta sezione `Vue component/view
      architecture` in `CLAUDE.md`; verificato router già lazy-loaded.
- [x] Dashboard caposala migrata a `PageHeader`, `EiraCard`, `EiraTable`,
      `InlineError` e `FormField`, riducendo CSS locale duplicato.
- [x] Creati componenti UI comuni `InlineError`, `EmptyState`,
      `PageHeader`, `EiraCard`, `EiraTable`, `FormField`.
- [x] Migrata view pilota `BancaOreView` su componenti UI comuni.
- [x] Migrata seconda view `PazientiView` su `PageHeader`,
      `InlineError`, `EmptyState`, `EiraTable`, `FormField`.
- [x] `stores/auth`: aggiunto stato sessione esplicito
      `unknown|authenticated|anonymous`, `ensureSession`,
      `clearSession`, `landingRoute`.
- [x] `router/index`: aggiunti metadata `roles`/`nav`, redirect
      diretto `/` e `/login` verso dashboard ruolo quando autenticato.
- [x] `AppShell`: nav derivata dai metadata route invece che da array
      hardcoded locale.
- [x] `LoginView`: persistenza reparto dispositivo migrata su
      `features/session/useDeviceReparto`.
- [x] Fase 4 avviata: installati `openapi-fetch` +
      `openapi-typescript`, generati `api/openapi.json` e
      `api/schema.d.ts`.
- [x] Creato `api/eiraClient.ts` tipizzato OpenAPI con auth header e
      401 → clear session.
- [x] Migrati a OpenAPI client mantenendo shape `{ data }`:
      `bancaOre`, `reparti`, `pazienti`.
- [x] Migrati a OpenAPI client mantenendo shape `{ data }`:
      `auth`, `turni`, `consegneSbar`, `cambiTurno`, `utenti`,
      `dashboard`, `diarioCedema`, `valutazioni`.
- [x] Rimosso vecchio `api/client.ts` axios e rimossa dependency
      `axios` da `package.json`/lock.
- [x] `LoginView`: logica reparto/tile/login/password temporanea
      estratta in `features/session/useLoginFlow`.
- [x] `SchedaPazienteView`: server-state/workflow estratto in
      `features/patient-chart/usePatientChart`; tab CEDEMA,
      valutazioni e storico SBAR estratti in componenti feature.
- [x] `CambioTurnoView` + dashboard caposala: workflow cambio turno
      estratto in `features/cambi-turno/useCambiTurno`.
- [x] `StaffView`: workflow personale estratto in
      `features/staff/useStaffWorkflow`; notice password temporanea
      estratta in componente feature.

### Frontend — deep module refactor

Obiettivo: trasformare le view più grandi in composition roots leggere,
spostando workflow, view-model, form mapping, constants e types nei
rispettivi feature modules.

- [x] **Fase DM-1 — Dashboard caposala deep module**:
      `features/dashboard/types.ts`, `calendarViewModel.ts`,
      `useCaposalaDashboard.ts`; spostati stato, computed, load,
      assegnazione turno e tipi view-model fuori dalla view.
- [x] **Fase DM-2 — Dashboard caposala presentational cards**:
      create `TurniScopertiCard`, `CambiTurnoCard`,
      `CalendarioTurniCard`; view ridotta a composizione props/events.
- [x] **Fase DM-3 — SBAR feature module**:
      create `features/sbar/types.ts`, `form.ts`, `useConsegneSbar.ts`;
      workflow/API/dialog/form/nome paziente spostati fuori dalla view.
- [x] **Fase DM-4 — shared formatting/constants**:
      create `utils/dateFormat.ts` e `features/turni/constants.ts`;
      applicati solo ai file toccati.
- [x] **Fase DM-5 — review e verifica finale**:
      `npm run typecheck && npm run build` passa; backend dirty files
      restano fuori scope.
- [x] **Fase DM-6 — Login view presentational split**:
      create componenti session `AuthCard`, `RepartoStep`, `UserTilesStep`,
      `PasswordStep`, `TemporaryPasswordStep`; `LoginView` ridotta a wiring
      del composable e gestione focus.
- [x] **Fase DM-7 — Patient chart dialogs/form module**:
      create `features/patient-chart/types.ts`, `form.ts` e dialog componenti;
      `SchedaPazienteView` ridotta a route/tabs/dialog wiring.

## Diagrammi / documentazione tesi

- [x] ER/UML in draw.io (`docs/diagrams/er-consegne-infermieristiche.drawio`) — 11 entità, relazioni complete (aggiunte 2 mancanti: autore_id su Norton/Conley), validato
- [x] Export PNG del diagramma per report (`docs/diagrams/er-consegne-infermieristiche.drawio.png`)
- [x] Swagger/OpenAPI (`/docs`) — verificata copertura tutte le entità una volta router reali: 21 path/32 operazioni, tutti gli 8 router entità + auth taggati, `/docs`+`/openapi.json` rispondono 200, Authorize (OAuth2 Bearer) funzionante
  - [x] Aggiunte `description` sugli endpoint con logica non ovvia (`cambi_turno.py`: flusso doppia conferma; `banca_ore.py`: calcolo saldo)
  - [x] Documentate risposte d'errore (400/401/403/404/409) nello schema via `responses={...}` (helper `app/openapi_errors.py`) su tutti i router
  - [x] POST di creazione ora ritornano 201 Created (`utenti`, `pazienti`, `turni`, `turni/assegnazioni`, `cambi-turno`, `consegne-sbar`, `diario-cedema`, `norton`, `conley`); test aggiornati (33 test passano)
  - [x] `DELETE /turni/{id}/assegnazioni` ora ritorna 204 No Content

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
