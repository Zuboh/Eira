# 0003 — openapi-fetch al posto di axios

**Status:** Accepted

## Context

Il frontend Eira (Vue 3 + TS) deve chiamare gli endpoint del backend
FastAPI (`turni`, `pazienti`, `consegne_sbar`, `valutazioni`,
`cambi_turno`, `banca_ore`, `dashboard`). `axios` è già presente in
`frontend/package.json` (dependency storica), ma non è ancora usato
per chiamate API reali (vedi `TASK.md`) — nessun call site da
migrare, quindi la scelta del client è ancora completamente aperta.

FastAPI espone automaticamente lo schema OpenAPI a `/openapi.json`.
Questo rende disponibile, gratis, una fonte di verità tipizzabile per
ogni request/response del backend — la domanda è quale client HTTP
sfrutta meglio quello schema lato TypeScript.

## Decision

Usiamo **`openapi-fetch`** (client fetch tipizzato, ~6kb) generando i
tipi con **`openapi-typescript`** a partire da `/openapi.json`.

Non usiamo `axios`: nonostante sia già installato, non ha una
pipeline diretta schema→tipi, richiede tipizzazione manuale o un
layer di codegen separato, e pesa ~32kb contro i 6kb del client
tipizzato. La dependency `axios` resta nel `package.json` per ora ma
va rimossa quando si conferma che nessuna chiamata reale la usa.

Motivazione completa, setup, uso base e checklist di review
(cancellation, race condition, retry, error handling, auth) in
`docs/FETCHING.md` — questo ADR ne è la sintesi decisionale, non la
duplica.

## Consequences

- Ogni endpoint ha request/response già tipizzati senza scriverli a
  mano; se il backend cambia schema, il build TS rompe subito invece
  di scoprirlo a runtime nella UI.
- I tipi vanno rigenerati manualmente (`npx openapi-typescript
  http://localhost:8000/openapi.json -o src/api/schema.d.ts`) ogni
  volta che un router backend cambia schema — nessuna generazione
  automatica in CI per ora, rischio di tipi stale se ci si dimentica.
- `axios` in `package.json` diventa dead weight da rimuovere appena
  si conferma che nessun call site lo usa (o da rimuovere ora, se si
  preferisce non aspettare).
- Se in futuro le viste con molte liste + mutazioni che si invalidano
  a vicenda (Pazienti, Consegne SBAR, Cambio Turno) diventano difficili
  da sincronizzare a mano, valutare `@tanstack/vue-query` come layer
  sopra `openapi-fetch` — non lo sostituisce, aggiunge caching/
  invalidation.

## Alternatives Considered

- **axios** — scartato: nessuna pipeline schema→tipi diretta (serve
  codegen aggiuntivo tipo `openapi-client-axios` o tipi scritti a
  mano), bundle 32kb vs 6kb, già installato ma non un motivo
  sufficiente a preferirlo.
- **ky** — client fetch moderno e leggero, ma nessuna integrazione
  nativa con `openapi-typescript`; richiederebbe wrapper manuale per
  ottenere la stessa tipizzazione end-to-end.
- **ofetch** (Nitro/UnJS) — buona ergonomia e retry integrato, ma
  stesso problema: nessun binding diretto allo schema OpenAPI, tipi da
  mantenere a mano.
- **VueUse `useFetch`** — comodo per casi semplici e reattività Vue,
  ma è un composable di alto livello, non un client tipizzato da
  schema; andrebbe comunque wrappato per allinearsi a `paths` generati
  da `openapi-typescript`, perdendo il vantaggio principale.

Vedi anche: [docs/FETCHING.md](../FETCHING.md)
