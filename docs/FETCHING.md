# Data Fetching — Eira Frontend

**Decisione:** `openapi-fetch` + `openapi-typescript` (non axios).

## Motivazione

Backend FastAPI espone schema OpenAPI automatico (`/openapi.json`).
`openapi-typescript` genera i tipi TS da quello schema, `openapi-fetch`
li usa per un client fetch tipizzato — ogni endpoint (`turni`,
`pazienti`, `consegne_sbar`, `valutazioni`, `cambi_turno`, `banca_ore`,
`dashboard`) ha request/response già tipizzati senza scriverli a mano.
Se il backend cambia schema, il build TS rompe subito invece di
scoprirlo a runtime. 6kb minified, zero overhead vs 32kb di axios.

## Setup

```bash
npm i openapi-fetch
npm i -D openapi-typescript
```

Rigenerare i tipi ogni volta che un router backend cambia schema:

```bash
npx openapi-typescript http://localhost:8000/openapi.json -o src/api/schema.d.ts
```

## Uso base

```ts
import createClient from "openapi-fetch";
import type { paths } from "./schema";

export const client = createClient<paths>({ baseUrl: import.meta.env.VITE_API_URL });

const { data, error } = await client.GET("/pazienti/{id}", {
  params: { path: { id } },
});
```

## Best practice da seguire (checklist review)

### Cancellation / memory leak
- [ ] Ogni fetch in componente ha `AbortController`, abortito su `onUnmounted`
- [ ] Nessuna fetch "fire and forget" senza cleanup

### Race condition
- [ ] Richiesta precedente cancellata/ignorata quando ne parte una nuova
      (es. cambio filtro lista pazienti a raffica)
- [ ] Nessun aggiornamento UI da risposta "stale" (flag o abort, non
      solo ultimo-vince per timing)

### Retry
- [ ] Limite massimo tentativi, backoff esponenziale (non retry infinito)
- [ ] Timeout esplicito per richiesta, non fetch che pende all'infinito
- [ ] Utente informato se retry in corso (no freeze silenzioso)

### Error handling
- [ ] Distinzione network/timeout vs errore business (401/403 auth ≠
      500 server ≠ offline)
- [ ] Error handling centralizzato in composable, non try/catch
      duplicato ovunque
- [ ] `errorCaptured` o error boundary a livello vista per fallback UI

### UI/UX
- [ ] Stati loading/error/empty espliciti (non solo `v-if data`), no flicker
- [ ] Skeleton/placeholder invece di spinner generico (banned anche da
      `docs/DESIGN.md` sez. 9)

### Auth-specifico Eira
- [ ] Refresh/scadenza JWT gestita centralmente (wrapper client o
      composable), non per-chiamata
- [ ] 401 → redirect login pulito, non stato app inconsistente

## Note

Se in futuro le viste con molte liste + mutazioni che si invalidano a
vicenda (Pazienti, Consegne SBAR, Cambio Turno) diventano difficili da
tenere sincronizzate a mano, valutare `@tanstack/vue-query` sopra
`openapi-fetch` per caching/invalidation automatica — non sostituisce
il client, aggiunge un layer di server-state management.
