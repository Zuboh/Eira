# Eira — Brainstorm valutazione tesi

> Note di lavoro, non documentazione di codebase. Contenuto: originalità,
> autovalutazione stato attuale, punchlist per 30/30, approfondimenti.
> Non è un piano deciso — sono spunti da rivedere/scartare.

## 1. Stato del progetto (riferimento rapido)

- Backend: FastAPI + SQLite + JWT (auth OAuth2 Password Flow, bcrypt diretto).
- Frontend: Vue 3 + Vite + TypeScript + Pinia + PrimeVue, data-fetching via `openapi-fetch`.
- Nucleo funzionale (mai tagliabile): ruoli infermiere/caposala scoping reparto,
  dashboard turni, consegne SBAR.
- Attorno al nucleo: diario CEDEMA, valutazioni Norton/Conley, cambio turno a
  doppia conferma, banca ore, ferie.
- 84 test backend passanti (era 33 al 2026-07-09; salita da feature ferie +
  estensioni SBAR/cambi turno, più 4 nuovi test sui due fix 🔴 sotto). 95
  test frontend (Vitest) su 11/15 composable (`useLoginFlow`,
  `useCaposalaDashboard`, `usePatientChart`, `useFerie`, `useBancaOre`,
  `useCambiTurno`, `useConsegneSbar`, `useStaffWorkflow`,
  `useDeviceReparto`, `useSbarCreateDialog`, `useInfermiereDashboard`);
  i 3 rimasti (`usePatientChartQueries/Dialogs/Sbar`) sono già
  esercitati indirettamente via `usePatientChart`. 4 test e2e (Playwright + axe-core,
  `npm run test:e2e`, solo locale — non in CI, v. §6): login reale,
  consegna SBAR, cambio turno round-trip multi-attore (richiedente →
  collega → caposala, 3 browser context separati), assegnazione turno
  scoperto. CI attiva su entrambi: backend (`ruff check` + `pytest`, 0
  violazioni su 58 iniziali), frontend (`eslint` + `prettier --check` +
  `vitest` + `typecheck` + `build`, 0 violazioni su 45 iniziali + 80 file
  riformattati).
- L'e2e ha trovato e fixato 6 bug reali di accessibilità mai emersi da
  lint/unit test (v. §5 per dettaglio): label PrimeVue `Password` non
  associata (`inputId` mancante), 2 contrasti colore isolati (sidebar
  attivo, badge `.chiusa`/`.attiva` — pattern text-on-own-tint, ora
  centralizzato in token `--state-*-on-tint`), 7 `<th>` azioni vuoti
  senza testo per screen reader. Tracciato ma non fixato: contrasto
  bottone PrimeVue default (bianco su blu primary) su ~44 usi in tutta
  l'app — decisione di palette colore, non un side-effect dei test.
- Zero bug 🔴 aperti (i due erano concreti e circoscritti, entrambi fixati
  con test di regressione), due 🟡 aperti (v. `TASK.md` / `docs/SECURITY.md`
  §3) — questi ultimi restano espliciti out-of-scope in attesa di una
  decisione di design (semantica "turno attivo"/"cambiata").
- Working tree pulito, feature ferie e i due fix 🔴 sopra committati.
- Report di tesi (Parte Prima + Seconda), screenshot funzionali e video
  walkthrough: non ancora iniziati.

## 2. Originalità — leve per il report

### Già presenti nel codice, da raccontare (costo zero)

- **Modello di autorizzazione reparto-scoped** con audit IDOR reale e
  documentato (`docs/SECURITY.md` §4, fix 2026-07-09) — case study di
  security review metodica, non solo "ho aggiunto un check".
- **Cambio turno a doppia conferma** (`in_attesa_collega → in_attesa_caposala
  → approvata`): macchina a stati non banale, vale un diagramma dedicato per
  la Parte Seconda.
- **Norton/Conley/SBAR/CEDEMA**: strumenti clinici reali, non campi inventati
  — citare le scale validate come fonte rafforza la sezione di dominio.
- **Alternativa Kotlin+Ktor scartata** (già annotata in `TASK.md`): materiale
  pronto per la sezione "abilità/strumenti", mostra processo decisionale
  reale.
- **Flusso login reparto → tile utente → password**: device condiviso di
  reparto (non account personale), scelta UX motivata dal contesto ospedaliero
  reale (tablet in corsia).

### Idee aggiuntive a basso costo

- **Audit trail leggero**: log append-only di chi ha creato/modificato una
  consegna SBAR o una valutazione — tracciabilità legale è un requisito reale
  in sanità, non decorativo.
- **Escalation su priorità "urgente"**: la consegna urgente resta evidenziata
  finché non "presa in carico" dal turno successivo — piccola state machine,
  forte valore di dominio.
- **Sezione di valutazione metodologica nel report**: numeri prima/dopo della
  Fase 6 (over-fetch reduction) — rigore ingegneristico misurabile.

## 3. Autovalutazione stato attuale (solo codice, report escluso)

> Giudizio qualitativo mio, non un voto ufficiale — non conosco la griglia
> esatta del relatore/Pegaso.

- **Backend: 30/30 sul codice esistente.** Test reali (84, passanti e
  committati) danno verifica empirica, non solo dichiarata. Modello di
  dominio solido, invariante di isolamento reparto applicata
  sistematicamente, audit trail storico dei fix di sicurezza. I due bug 🔴
  (crash su delete assegnazione con cambio turno pendente, test suite che
  scriveva sul DB di produzione) sono stati diagnosticati con precisione e
  poi fixati con test di regressione dedicati; il check di startup JWT
  fail-fast in produzione è implementato; CI (ruff + pytest) attiva su ogni
  push/PR. Restano solo i due 🟡, esplicitamente rimandati in attesa di una
  decisione di design (non un gap di qualità).
- **Frontend: 29/30.** Architettura il punto più forte — moduli
  feature-based, composition roots leggeri, design tokens, accessibilità
  manuale ora anche **verificata empiricamente** via axe-core (0
  violazioni sulle 4 pagine chiave testate) — sopra lo standard
  triennale. Lint/CI presenti (ESLint + Prettier, 0 violazioni, gate su
  ogni push/PR); 95 test Vitest su 11/15 composable + 4 test e2e sui
  flussi chiave, in CI (Vitest) e locale (e2e, v. §6). Cambio turno con
  secondo account **ora verificato** (era esplicitamente non testato).
  Restano: i 3 composable patient-chart senza test dedicato (già
  esercitati indirettamente), e2e ancora locale (non in CI), viste
  Norton/Conley ancora solo da code review (banca ore ora coperta da
  `useBancaOre.spec.ts`).

Differenza chiave tra i due: il backend ha verifica empirica (test) a
sostegno della qualità dichiarata, il frontend ha qualità architetturale ma
verifica solo manuale/dichiarata.

## 4. Cosa manca per 30/30

### Backend

1. ~~Fix dei due 🔴~~ — fatto:
   - crash su `DELETE /turni/{id}/assegnazioni` → check richieste cambio
     turno pendenti prima della cancellazione, 409 invece di procedere;
   - isolamento reale del DB di test → fixture `client` pulisce
     `app.router.on_startup` prima del `TestClient`, engine di produzione
     non più toccato durante i test.
2. Fix dei due 🟡 (design ancora da decidere, esplicitamente out-of-scope):
   - assegnare `StatoAssegnazione.cambiata` nello swap turno;
   - decidere/implementare se il gate "turno attivo" va ristretto a "turno
     di oggi".
3. ~~Lint/format~~ — Ruff configurato (E/F/I/UP/B, `StrEnum` modernization
   rimandata di proposito), 0 violazioni su 58 iniziali.
4. ~~CI~~ — GitHub Action (`ruff check` + `pytest`) su ogni push/PR a main.
5. ~~Hardening JWT/secret~~ — implementato (dettaglio §5).

### Frontend

1. ~~Unit test sui composable~~ — 11/15 fatti (`useLoginFlow`,
   `useCaposalaDashboard`, `usePatientChart`, `useFerie`, `useBancaOre`,
   `useCambiTurno`, `useConsegneSbar`, `useStaffWorkflow`,
   `useDeviceReparto`, `useSbarCreateDialog`, `useInfermiereDashboard`,
   95 test Vitest, in CI). Restano i 3 sotto-composable di
   `usePatientChart` (`Queries`/`Dialogs`/`Sbar`) — già esercitati
   indirettamente ma senza test dedicati.
1b. ~~4 test e2e Playwright sui flussi chiave~~ — fatto (login, consegna
   SBAR, cambio turno round-trip multi-attore, assegnazione turno
   scoperto), axe-core incluso, solo locale (non in CI, v. §6).
2. Verificare end-to-end le viste ancora segnate come non verificate in
   `TASK.md`: creazione Norton/Conley, banca ore (cambio turno con
   secondo account infermiere **ora coperto** dal test e2e multi-attore).
3. ~~Lint~~ — ESLint (flat config, typescript-eslint + eslint-plugin-vue
   recommended) + Prettier, entrambi in CI. `vue/attribute-hyphenation`
   disattivata di proposito (PrimeVue usa prop camelCase per API
   documentata, non attributi HTML nativi — la regola avrebbe forzato una
   riscrittura contro le convenzioni della libreria).
4. Validazione manuale su viewport/dispositivi reali (follow-up storico mai
   chiuso, v. `CLAUDE.md`).
5. Audit di accessibilità automatico (dettaglio §5).

Pattern comune: il gap non è più di design, è di **verifica automatizzata**
(test + CI) e chiusura dei problemi già diagnosticati.

## 5. Approfondimenti

### Backend — hardening JWT/secret

Due questioni distinte:

- **Secret di default** (`dev-secret-change-in-production` in
  `core/config.py`, citato anche in chiaro in `docs/SECURITY.md`): rischio
  reale se il deploy dimentica di sovrascriverlo via env var. **Implementato**:
  nuovo campo `environment` in `Settings` (default `"development"`); a
  startup, `main.py:_check_jwt_secret` rifiuta l'avvio con `RuntimeError` se
  `environment == "production"` e il secret è ancora quello di default,
  mantenendo solo il warning nei casi non-production. Test dedicato in
  `tests/test_startup_config.py` (entrambi i rami, con/senza raise).
- **Refresh token assente**: raccomandazione è **non implementarlo**.
  Aggiungerlo introduce storage/rotazione/revoca lato server e superficie
  di attacco in più, per un'app dove il turno tipico dura 6-8h e il token
  scade a 8h — la sessione JWT coincide già col turno di lavoro. Meglio
  argomentare nel report che l'assenza di refresh token è una scelta di
  design coerente col dominio (fine sessione = fine turno, dispositivo
  condiviso di reparto), non una lacuna.

Per il punto 5 backend: il check di startup è implementato; resta solo la
frase da scrivere nel report per l'altro punto (refresh token) — non serve
altro codice.

### Frontend — audit di accessibilità automatico

**Implementato**: `@axe-core/playwright` dentro ai 4 test e2e (`e2e/helpers/a11y.ts`),
zero violazioni su ogni pagina chiave testata (login, dashboard caposala,
consegne SBAR, cambio turno). 6 bug reali trovati e fixati nel processo:

- `PasswordStep.vue`: `<Password id="password">` impostava l'id del
  wrapper, non dell'input nativo — il `<label for="password">` non era
  mai davvero associato. Fix: prop `input-id` di PrimeVue.
- Contrasto colore, sidebar (`AppShell.vue`): link attivo e bottone
  "Esci" usavano il token semantico come colore testo direttamente sul
  proprio tint chiaro (es. `--color-primary` su `color-mix(...
  --color-primary 12%)`) — matematicamente non può mai arrivare a 4.5:1
  se il testo è la stessa tinta dello sfondo. Fix: nuovi token
  `--color-primary-on-tint` / `--state-*-on-tint` (varianti dark-mode
  invariate, già abbastanza chiare).
- Stesso pattern in `StatusBadge.vue` (tutti e 4 gli stati) — stessi
  token riusati.
- 7 file con `<th></th>` vuoti in colonne azioni, senza testo per
  screen reader — nuova classe utility `.sr-only` in `style.css`,
  applicata ovunque dopo aver trovato il primo caso e verificato che il
  pattern fosse sistemico.

**Non fixato, tracciato**: bottone PrimeVue small di default (bianco su
blu primary, ~44 usi in tutta l'app) fallisce 4.5:1 (3.67:1 misurato) —
decisione di palette colore che tocca l'identità visiva dell'app,
esclusa deliberatamente dagli assert (`e2e/helpers/a11y.ts` esclude
`.p-button`) invece di essere silenziosamente "risolta" come side
effect dell'aggiunta di e2e.

Nota di rischio prevista si è confermata: PrimeVue genera davvero falsi
positivi/frizioni sui suoi componenti interni (qui: bottoni, prop
`inputId` vs `id`) — gestiti con esclusioni mirate, non con fix
indiscriminati.

## 6. Prossimi passi possibili (da scegliere, non decisi)

- Test dedicati sui 3 sotto-composable `usePatientChart*` (bassa
  priorità — già esercitati indirettamente).
- e2e in CI: oggi solo locale (`npm run test:e2e`) — serve un job CI che
  avvii backend+frontend insieme (stesso pattern webServer, DB throwaway
  dedicato), più complesso del job attuale ma non bloccante.
- Decidere se/come affrontare il contrasto bottone PrimeVue (~44 usi,
  tracciato non fixato — v. §5): richiede una decisione di palette,
  non un fix meccanico.
- Decidere/implementare i due 🟡 rimasti (enum `StatoAssegnazione.cambiata`,
  scoping "turno attivo").
- Scaletta del report (Parte Prima + Seconda).
