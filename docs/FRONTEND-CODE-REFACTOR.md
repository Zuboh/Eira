# Frontend Code Refactor Plan

**Status:** Draft  
**Scope:** `frontend/src` Vue 3 + TypeScript + PrimeVue frontend  
**Goal:** Ridurre il debito architetturale del frontend senza bloccare la demo: tipi API allineati al backend, view più piccole, UI più coerente, routing/sessione più espliciti, accessibilità/responsive migliori.

## Contesto

La base attuale è funzionante: il build frontend passa con `npm run build`, il routing protetto esiste, PrimeVue è configurato, e le viste operative principali sono collegate a dati reali.

Il problema non è un singolo bug: il rischio principale è che le view stanno facendo troppe cose insieme:

- data fetching;
- mapping `AxiosResponse.data`;
- join client-side tra liste;
- form state;
- workflow di dominio;
- gestione error/loading;
- markup tabellare;
- CSS scoped duplicato.

Questo piano rende il refactor incrementale: ogni fase deve lasciare l'app compilabile e usabile.

## Non-obiettivi

- Non riscrivere l'intero frontend in un'unica PR.
- Non introdurre uno state manager server-side complesso se non serve subito.
- Non cambiare UX/flussi di dominio senza necessità.
- Non spostare logica di autorizzazione reale dal backend al frontend: il frontend migliora UX e chiarezza, il backend resta fonte di sicurezza.

## Principi guida

1. **Vertical slices piccole:** migrare una feature alla volta.
2. **View come composition root:** le view compongono componenti/composables, non contengono workflow interi.
3. **Contratto API generato:** niente tipi response/request scritti a mano dove OpenAPI può generarli.
4. **UI primitives prima del polish:** estrarre componenti piccoli e ripetuti prima di ridisegnare schermate.
5. **Accessibilità di base non opzionale:** link/bottoni reali, label esplicite, `aria-label` per icon button, tabelle responsive.
6. **Build sempre verde:** ogni fase termina con `npm run build`.

## Fase 0 — Baseline e guardrail

**Obiettivo:** mettere a terra una base verificabile prima dei refactor.

### Task

- [ ] Aggiungere script frontend:

  ```json
  {
    "typecheck": "vue-tsc --noEmit",
    "build": "vue-tsc -b && vite build"
  }
  ```

- [ ] Valutare ESLint/Prettier se il tempo lo consente:

  ```json
  {
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
  ```

- [ ] Aggiornare `frontend/README.md`, oggi ancora template Vite, con:
  - avvio dev;
  - `VITE_API_BASE_URL`;
  - comandi verifica;
  - nota design system;
  - nota OpenAPI/client.
- [ ] Rimuovere dal workspace file OS non tracciati (`.DS_Store`) se presenti.

### Acceptance criteria

- [ ] `cd frontend && npm run build` passa.
- [ ] README frontend descrive il progetto Eira, non il template Vite.

## Fase 1 — Quick wins UX/accessibilità/performance

**Obiettivo:** correggere rischi piccoli ma concreti senza cambiare architettura profonda.

### Task

- [ ] `PazientiView.vue`: sostituire riga cliccabile `<tr @click>` con link/bottone accessibile.

  Preferito:

  ```vue
  <RouterLink :to="{ name: 'paziente-scheda', params: { id: p.id } }">
    {{ p.cognome }} {{ p.nome }}
  </RouterLink>
  ```

- [ ] `BancaOreView.vue`: eliminare doppio fetch iniziale per caposala.
- [ ] `BancaOreView.vue`: aggiungere `aria-label` ai bottoni solo-icona mese precedente/successivo.
- [ ] Tabelle larghe: aggiungere wrapper con overflow interno almeno a:
  - `SchedaPazienteView.vue`;
  - `ConsegneSbarView.vue`;
  - `PazientiView.vue`.
- [ ] `caposala/DashboardView.vue`: sostituire lookup ripetuti `.find()` in render loop con mappe computed:

  ```ts
  const utentiById = computed(() => new Map(utenti.value.map((u) => [u.id, u])))
  const turniByKey = computed(() => new Map(calendario.value.map((t) => [`${t.data}:${t.tipo}`, t])))
  ```

- [ ] Rimuovere colori hardcoded residui (`#fff`, fallback `#3b82f6`) dove sostituibili con token.

### Acceptance criteria

- [ ] Navigazione paziente accessibile da tastiera.
- [ ] Nessun doppio `GET /banca-ore/{id}` all'apertura caposala.
- [ ] Tabelle principali non causano overflow orizzontale della pagina.
- [x] `npm run build` passa.

## Fase 2 — Mini UI layer interno

**Obiettivo:** fermare la duplicazione CSS/markup creando primitive applicative leggere.

### Nuova struttura proposta

```txt
frontend/src/components/ui/
  PageFrame.vue
  PageHeader.vue
  EiraCard.vue
  EiraTable.vue
  InlineError.vue
  EmptyState.vue
  FormField.vue
  StatTile.vue
```

### Task

- [ ] Creare `InlineError.vue` per errori con `role="alert"`.
- [ ] Creare `EmptyState.vue` per stati vuoti coerenti.
- [ ] Creare `PageHeader.vue` per titolo + azioni.
- [ ] Creare `EiraCard.vue` per box/card comuni.
- [ ] Creare `EiraTable.vue` o `DataTableShell.vue` con:
  - wrapper `overflow-x: auto`;
  - classe tabella coerente;
  - slot default;
  - supporto empty state.
- [ ] Creare `FormField.vue` per label + id/inputId + help/error text.
- [ ] Migrare una view piccola come pilota: `BancaOreView.vue`.
- [ ] Migrare poi `PazientiView.vue`.

### Regole

- Non creare componenti troppo generici con API pesanti.
- Preferire slot semplici.
- I componenti UI non devono conoscere endpoint o Pinia.

### Acceptance criteria

- [ ] Almeno due view usano i componenti UI comuni.
- [ ] Duplicazioni `.data-table`, `.form`, `.error`, `.hint`, `.header` iniziano a diminuire.
- [ ] `npm run build` passa.

## Fase 3 — Sessione e routing più espliciti

**Obiettivo:** chiarire stato auth, landing route, permessi UI e navigazione.

### Problemi da risolvere

- Route condivise senza metadata ruoli espliciti.
- `/` redirige sempre a `/login` anche se autenticato.
- `/login` non redirige automaticamente alla dashboard se già autenticato.
- `api/client.ts`, router e store auth sono accoppiati tramite dettagli interni.

### Task

- [ ] Introdurre helper:

  ```ts
  export function landingRouteForRole(ruolo: 'infermiere' | 'caposala') {
    return ruolo === 'caposala' ? 'caposala-dashboard' : 'infermiere-dashboard'
  }
  ```

- [ ] Estendere route metadata:

  ```ts
  meta: {
    public?: boolean
    roles?: Array<'infermiere' | 'caposala'>
    navLabel?: string
  }
  ```

- [ ] Applicare `roles` esplicitamente anche alle route condivise:
  - `pazienti`;
  - `paziente-scheda`;
  - `consegne-sbar`;
  - `cambio-turno`;
  - `banca-ore`.
- [ ] Derivare `AppShell` nav dai route metadata o da una config condivisa tipizzata, non da array hardcoded locale.
- [ ] Evolvere `stores/auth.ts` con stato esplicito:

  ```ts
  type SessionStatus = 'unknown' | 'authenticated' | 'anonymous'
  ```

- [ ] Aggiungere metodi:
  - `ensureSession()`;
  - `clearSession(reason)`;
  - `landingRoute` computed.
- [ ] Centralizzare la persistenza reparto dispositivo fuori da `LoginView.vue`:

  ```txt
  frontend/src/features/session/useDeviceReparto.ts
  ```

### Acceptance criteria

- [ ] `/` manda alla dashboard giusta se autenticato.
- [ ] `/login` manda alla dashboard giusta se già autenticato.
- [ ] Le route dichiarano chiaramente i ruoli ammessi.
- [ ] `AppShell` non duplica più logica permessi ad hoc.
- [ ] `npm run build` passa.

## Fase 4 — Data-fetching module OpenAPI

**Obiettivo:** allineare il frontend all'ADR `docs/adr/0003-openapi-fetch-vs-axios.md` e a `docs/FETCHING.md`.

### Nuova struttura proposta

```txt
frontend/src/api/
  schema.d.ts          # generato da openapi-typescript
  eiraClient.ts        # client base openapi-fetch
  errors.ts            # mapping errori backend -> UI/domain error
  queries/
    auth.ts
    pazienti.ts
    turni.ts
    consegneSbar.ts
    cambiTurno.ts
    bancaOre.ts
    dashboard.ts
```

### Task

- [ ] Installare dipendenze:

  ```bash
  cd frontend
  npm i openapi-fetch
  npm i -D openapi-typescript
  ```

- [ ] Generare schema dal backend:

  ```bash
  npx openapi-typescript http://localhost:8000/openapi.json -o src/api/schema.d.ts
  ```

- [ ] Creare `eiraClient.ts` con:
  - `baseUrl` da env;
  - auth header da store/session;
  - callback centralizzata `onUnauthorized`;
  - normalizzazione errori.
- [ ] Migrare per prime feature piccole:
  1. `bancaOre`;
  2. `reparti`;
  3. `pazienti`.
- [ ] Migrare poi feature operative:
  1. `consegneSbar`;
  2. `cambiTurno`;
  3. `turni`;
  4. `valutazioni`;
  5. `dashboard`.
- [ ] Rimuovere tipi request/response manuali dove sostituiti da schema generato.
- [ ] Rimuovere axios da `package.json` solo quando nessun call site lo usa più.

### Regole

- Le view non devono importare `AxiosResponse` o dipendere da `.data` di axios.
- Le query devono restituire dati già normalizzati o errori tipizzati.
- Ogni migrazione deve essere verticale e compilabile.

### Acceptance criteria

- [ ] Almeno `bancaOre`, `reparti`, `pazienti` usano OpenAPI client.
- [ ] Nessun drift manuale per i tipi delle feature migrate.
- [ ] `npm run build` passa.
- [ ] Axios rimosso se completamente inutilizzato.

## Fase 5 — Feature composables e view più piccole

**Obiettivo:** spostare workflow e server-state fuori dalle view più grandi.

### Target principali

1. `LoginView.vue`
2. `SchedaPazienteView.vue`
3. `caposala/DashboardView.vue`
4. `CambioTurnoView.vue`
5. `ConsegneSbarView.vue`

### Struttura proposta

```txt
frontend/src/features/
  session/
    useDeviceReparto.ts
    useLoginFlow.ts
    RepartoPicker.vue
    UserTilePicker.vue
    PasswordStep.vue
    TemporaryPasswordStep.vue

  patient-chart/
    usePatientChart.ts
    CedemaTab.vue
    ValutazioniTab.vue
    StoricoSbarTab.vue
    EditPatientDialog.vue

  cambi-turno/
    useCambiTurno.ts
    CambioTurnoTable.vue
    RichiestaCambioDialog.vue
    RifiutoCambioDialog.vue

  staff/
    useStaffWorkflow.ts
    StaffTable.vue
    TemporaryPasswordNotice.vue

  turni/
    TurniCalendarTable.vue
    AssegnaTurnoDialog.vue
```

### Task

- [ ] Estrarre `useLoginFlow` da `LoginView.vue`.
- [ ] Estrarre componenti step login:
  - `RepartoPicker`;
  - `UserTilePicker`;
  - `PasswordStep`;
  - `TemporaryPasswordStep`.
- [ ] Estrarre `usePatientChart(pazienteId)` da `SchedaPazienteView.vue`.
- [ ] Estrarre tab scheda paziente:
  - CEDEMA;
  - Valutazioni;
  - Storico SBAR.
- [ ] Estrarre `useCambiTurno` e riusarlo tra `CambioTurnoView.vue` e dashboard caposala.
- [ ] Estrarre workflow staff (`StaffView.vue`) in `useStaffWorkflow`.

### Acceptance criteria

- [ ] `LoginView.vue` scende sotto ~250 righe.
- [ ] `SchedaPazienteView.vue` scende sotto ~250 righe.
- [ ] I workflow riusati non sono duplicati tra dashboard e view dedicate.
- [ ] `npm run build` passa.

## Fase 6 — API aggregate / over-fetch reduction

**Obiettivo:** ridurre `list tutto + join client-side` nelle schermate operative.

**Stato:** completata la quota frontend-only. Restano candidati backend/API
per eliminare davvero i payload globali quando il progetto consente modifiche
al contratto HTTP.

### Candidati backend/API

- [ ] `GET /dashboard/infermiere`
- [ ] `GET /pazienti/{id}/scheda`
- [ ] `GET /pazienti/{id}/consegne-sbar`

### Candidati frontend-only se non si cambia backend

- [x] Query composables con mappe computed:

  ```ts
  const pazientiById = computed(() => new Map(pazienti.value.map((p) => [p.id, p])))
  const utentiById = computed(() => new Map(utenti.value.map((u) => [u.id, u])))
  const turniById = computed(() => new Map(turni.value.map((t) => [t.id, t])))
  ```

- [x] Evitare chiamate sequenziali quando possono stare nello stesso `Promise.all` condizionale.
- [ ] Introdurre cancellation/ignore stale response nei fetch dipendenti da filtri.

### Implementato frontend-only

- `frontend/src/views/infermiere/DashboardView.vue`
  - lookup `turni`/`pazienti` via `computed Map`;
  - stato locale ridotto a consegne recenti e pazienti attivi usati dalla UI.
- `frontend/src/views/ConsegneSbarView.vue`
  - lookup pazienti via `computed Map`;
  - `getMieAssegnazioni()` spostato dal load iniziale all'apertura del dialog
    “Nuova consegna”.
- `frontend/src/features/patient-chart/usePatientChart.ts`
  - storico SBAR tolto dal load iniziale della scheda paziente;
  - fetch globale delle consegne eseguito lazy solo quando la tab SBAR viene
    aperta.

### Acceptance criteria

- [x] Dashboard infermiere non deve caricare dati inutili rispetto alla UI mostrata, oppure il tradeoff deve essere documentato.
- [x] Scheda paziente non deve caricare tutte le consegne globali solo per filtrarle client-side, se esiste endpoint/query dedicata.
- [x] `npm run build` passa.

## Fase 7 — Design token governance e responsive finale

**Obiettivo:** allineare codice, `docs/DESIGN.md` e PrimeVue theme.

### Task

- [x] Verificare se `--logo-accent` deve esistere davvero: `TASK.md` lo cita, `style.css` no.
- [x] Aggiungere token mancanti:

  ```css
  --color-on-primary: #ffffff;
  --color-on-danger: #ffffff;
  --space-1: ...;
  --space-2: ...;
  --page-padding: ...;
  --table-min-wide: ...;
  --dialog-sm/md/lg: ...;
  ```

- [x] Rimuovere colori hardcoded residui.
- [x] Rendere `AppShell` responsive:
  - sidebar fissa desktop;
  - top nav/collasso sotto soglia tablet;
  - contenuto con `min-width: 0` e niente overflow pagina.
- [ ] Validare manualmente principali viewport:
  - desktop;
  - tablet reparto;
  - mobile stretto.

### Implementato

- Token spacing/layout/dialog/contrast aggiunti in `frontend/src/style.css`.
- `frontend/src/components/layout/AppShell.vue` passa da sidebar fissa a top
  nav scrollabile sotto `48rem`.
- `frontend/src/components/ui/dialogStyles.ts` governa le larghezze dialog con
  `min(var(--dialog-*), calc(100vw - var(--space-8)))`.
- Page root principali migrati da `padding: 32px` a `--page-padding`.
- Rimossi raw `#fff` e fallback `#3b82f6` dalle view frontend; i raw hex
  rimasti sono limitati al file token/theme.

### Acceptance criteria

- [x] Nessun overflow orizzontale di pagina nelle viste principali.
- [x] Token usati in codice sono coerenti con `docs/DESIGN.md`.
- [x] `npm run build` passa.

## Ordine consigliato delle PR/commit

1. `frontend: add baseline scripts and README`
2. `frontend: fix accessibility quick wins`
3. `frontend: add shared UI primitives`
4. `frontend: migrate small views to UI primitives`
5. `frontend: make session routing explicit`
6. `frontend: introduce OpenAPI typed client`
7. `frontend: migrate banca ore/reparti/pazienti API`
8. `frontend: extract login flow composables`
9. `frontend: extract patient chart modules`
10. `frontend: reduce dashboard over-fetching`
11. `frontend: finalize responsive shell and token cleanup`

## Verifica per ogni fase

Minimo:

```bash
cd frontend
npm run build
```

Se aggiunti:

```bash
npm run typecheck
npm run lint
npm run format:check
```

Verifica manuale consigliata:

- login reparto → tile → password;
- cambio password temporanea;
- dashboard infermiere;
- dashboard caposala;
- pazienti → scheda;
- nuova consegna SBAR;
- cambio turno;
- banca ore;
- viewport tablet/mobile sulle tabelle.

## Definition of Done complessiva

- [ ] Frontend compila.
- [ ] Tipi API principali generati da OpenAPI o piano di migrazione chiaro.
- [ ] View più grandi ridotte o isolate in feature composables.
- [ ] UI primitives comuni usate da più viste.
- [ ] Routing/ruoli espliciti e nav coerente.
- [ ] Accessibilità base corretta per link/bottoni/form.
- [ ] Tabelle responsive con overflow interno, non di pagina.
- [ ] README frontend aggiornato.
