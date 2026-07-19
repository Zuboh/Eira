# Performance Audit — Eira (2026-07-19)

Fase 1: audit (misurazione). Fase 2 (stesso giorno): fix del batch 🟡
(F1, F2, B1, B2) — vedi sezione "Fix applicate" in fondo. Batch 🟢 resta
backlog, non applicato.

## Skill/tool usati

| Skill | Fonte | Install | Copertura reale |
|---|---|---|---|
| `performance` | `addyosmani/web-quality-skills@performance` | 23.8K | Playbook web generico (non Vue-specifico): budget di peso pagina, Core Web Vitals, Lighthouse/`web-vitals`, immagini/font/caching/code-splitting. Riferimento a una skill sorella `core-web-vitals` non installata (link non risolvibile — non necessaria per questo giro). |
| `python-performance-optimization` | `wshobson/agents@python-performance-optimization` | 29.3K | Cookbook di profiling CPython generico (cProfile/line_profiler/py-spy/tracemalloc/pattern algoritmici). **Non conosce FastAPI/SQLAlchemy** — nessun contenuto su N+1, eager loading, pool sizing. La parte DB (indici, `EXPLAIN`, batching) è generica e qui applicata manualmente allo stack reale. |

Metodologia frontend: misura via Lighthouse CLI (`npx lighthouse`) contro
build di produzione (`vite build` + `vite preview`), non contro il dev
server (Vite dev server è deliberatamente non minificato/non bundlato —
misurarlo con Lighthouse dà numeri fuorvianti, vedi nota sotto).

Metodologia backend: analisi statica dei router (query loop, paginazione,
aggregazione lato Python) + `EXPLAIN QUERY PLAN` su SQLite dev
(`consegne_infermieristiche.db`, dataset seedato: 1344 turni, 1680
assegnazioni, 30 pazienti) per verificare empiricamente gli indici mancanti.

## Frontend

### Misura Lighthouse (build produzione, `/login`, headless Chrome)

⚠️ Prima run contro dev server (`localhost:5173`) ha dato Performance
0.49, LCP 25.8s, FCP 14.4s — numeri **non rappresentativi** (dev server
Vite serve ES modules non bundlati + HMR client, sempre lento a
Lighthouse). Rifatto contro `vite build` + `vite preview` (`localhost:4173`)
per un numero reale:

| Metrica | Valore | Target skill | Esito |
|---|---|---|---|
| Performance score | 0.96 | — | 🟢 |
| LCP | 2.5 s | < 2.5 s | 🟡 al limite |
| FCP | 2.1 s | < 1.8 s | 🟡 leggermente sopra |
| Speed Index | 2.1 s | < 3.4 s | 🟢 |
| TBT | 40 ms | < 200 ms | 🟢 |
| CLS | 0.005 | — | 🟢 |
| TTI | 2.5 s | < 3.8 s | 🟢 |
| Total byte weight | — | < 1.5 MB budget | non superato |
| Best Practices | 0.96 | — | 1 console error rilevato su `/login` |
| SEO | 0.82 | — | manca meta description, `robots.txt` non valido (fuori scope perf) |

Nel complesso: build di produzione è già in buona forma. LCP/FCP sono
borderline sui target dello skill ma non critici.

### Findings statici (da bundle + codice)

| # | Issue | Evidenza | Severità | Raccomandazione |
|---|---|---|---|---|
| F1 | Chunk dashboard infermiere sproporzionato | ⚠️ **Attribuzione corretta rispetto alla stima iniziale**: il chunk da 233.70 KB / 70.06 KB gzip è la dashboard **infermiere** (non caposala — verificato via grep sul testo "Dashboard Infermiere" dentro il chunk buildato), che importa `TurniCalendarCard.vue` (FullCalendar) in modo eager. La dashboard caposala usa `CalendarioTurniCard.vue`, una tabella HTML pura, nessun FullCalendar — il suo chunk è già piccolo (8.45 KB). | 🟡 | Lazy-load il componente calendario con `defineAsyncComponent(() => import(...))`, isolando FullCalendar dal resto della vista. |
| F2 | Over-fetch consegne SBAR su dashboard infermiere | `useInfermiereDashboard.ts` chiamava `listConsegneSbar()` senza parametri (default: fino a 25 righe) poi tagliava a 5 lato client — mentre `listConsegneSbar` supporta già `limit` lato server. Nota: `listPazienti()` senza filtro `dimesso` **non** è over-fetch nello stesso senso — `PazientiAttiviCard` mostra davvero l'intera lista pazienti attivi in reparto, non solo un conteggio; il backend non espone comunque un filtro `dimesso` su `GET /pazienti` (richiederebbe una modifica di contratto API, fuori scope di questo batch). | 🟡 (consegne) / 🟢 (pazienti, non risolvibile senza toccare l'API) | Passare `{ limit: 5 }` a `listConsegneSbar`. |
| F3 | Nessun layer di cache/dedup richieste | `api/eiraClient.ts` è un client `openapi-fetch` puro, nessuna cache/staleness (no vue-query/pinia-colada). Ogni `onMounted` rifà tutte le fetch da zero; le mutazioni (`confermaAssegna`, `usePatients.salva`) rifanno l'intero `load()` invece di aggiornare lo stato locale. | 🟢 basso rischio oggi, cresce con l'uso | Valutare `@tanstack/vue-query` o patch locale dello stato dopo mutazione, se le viste iniziano a sentirsi lente in uso reale. |
| F4 | Nessun bundle-analysis/compression tooling | `vite.config.ts` non ha `manualChunks`, `vite-plugin-compression`, né bundle visualizer. | 🟢 | Aggiungere `rollup-plugin-visualizer` in dev per monitorare la crescita dei chunk nel tempo. |
| F5 | PrimeIcons SVG font intero | `primeicons-*.svg` 342.52 KB / 108.35 KB gzip caricato indipendentemente da quante icone si usano realmente. | 🟢 | Basso impatto pratico (asset statico cacheable), non prioritario. |

## Backend

### Findings statici + evidenza `EXPLAIN QUERY PLAN`

| # | Issue | Evidenza | Severità | Raccomandazione |
|---|---|---|---|---|
| B1 | Indici mancanti su colonne FK filtrate di frequente | `EXPLAIN QUERY PLAN SELECT * FROM turno WHERE reparto_id=1` → `SCAN turno` (full scan su 1344 righe). Stesso per `assegnazione_turno WHERE infermiere_id=1` → `SCAN assegnazione_turno` (1680 righe), e `paziente WHERE reparto_id=1` → `SCAN paziente`. L'unico indice esplicito nello schema è `Utente.email`; gli altri "indici" sono in realtà `UniqueConstraint` composti che coprono solo la colonna di testa (es. `turno` ha `UNIQUE(data, tipo, reparto_id)` — inutile per filtrare solo su `reparto_id`). Colonne coinvolte: `Turno.reparto_id`, `AssegnazioneTurno.infermiere_id`/`stato`, `Paziente.reparto_id`, `Utente.reparto_id`, `ConsegnaSbar.turno_id`, `RichiestaCambioTurno.*`, `RichiestaFerie.infermiere_id`/`stato`, `ValutazioneNorton/Conley.paziente_id`, `VoceDiarioCedema.paziente_id`. | 🟡 | Aggiungere `index=True` (o indice esplicito) sulle colonne FK/status usate come predicato `WHERE` nei router. Con dataset dev piccolo l'impatto non si sente; cresce linearmente con turni/consegne reali (nessuna archiviazione). |
| B2 | N+1 in `ferie.py` | `list_richieste` chiama `_to_read()` per ogni riga; `_to_read` esegue una query separata su `richiesta_ferie_preferenza` per richiesta (`richiesta_ferie.py`). Verificato: quella query singola *è* indicizzata (`SEARCH ... USING INDEX sqlite_autoindex_richiesta_ferie_preferenza_1`, colonna di testa dello `UNIQUE(richiesta_id, rank)`), quindi ogni singola query è veloce — il problema è il numero di round-trip (1 + N invece di 1 join/batch), non la singola query. | 🟡 | Sostituire con un join o batch-fetch di tutte le preferenze per l'insieme di richieste in una query sola. |
| B3 | Nessuna paginazione sulla maggior parte degli endpoint di lista | `turni.py` (`list_turni`, `list_calendario_turni`, `list_turni_scoperti`, `list_mie_assegnazioni`), `pazienti.py`, `cambi_turno.py`, `dashboard.py`, `banca_ore.py`: tutti `.all()` senza `skip`/`limit` né filtro temporale. Unico endpoint fatto bene: `consegne_sbar.py::list_consegne` (skip/limit + count totale). | 🟢 rischio basso oggi (dataset piccolo), cresce nel tempo | Applicare lo stesso pattern di `consegne_sbar.py` agli altri list endpoint, priorità a `turni.py` (tabella più popolata: 1344 righe già in dev). |
| B4 | Nessuna configurazione connection pool | `core/database.py`: `create_engine(settings.database_url, connect_args=...)` senza `pool_size`/`max_overflow`/`pool_pre_ping`/`pool_recycle`. Non rilevante su SQLite (nessun vero pooling), ma latente: se/quando si passa a Postgres, si eredita il default SQLAlchemy (pool 5 + overflow 10, nessun pre-ping) — problema classico sotto carico concorrente. | 🟡 (latente, non attivo su SQLite) | Aggiungere config esplicita di pool quando si migra a Postgres, non prima. |
| B5 | Aggregazione in Python invece che in SQL | `banca_ore.py::get_banca_ore` somma le ore turno riga per riga in Python (`sum(_ore_turno(t) for t in turni_mese)`) invece di un `SUM` SQL. Volume ridotto (1 mese di turni per infermiere), impatto pratico basso. | 🟢 | Non prioritario. |
| B6 | Doppia fetch dello stesso paziente | `valutazioni.py::get_valutazioni_aggregate` chiama `list_norton` e `list_conley`, ciascuna delle quali richiama `_get_paziente_same_reparto` — stesso `Paziente` recuperato 2 volte per richiesta. | 🟢 | Recuperare il paziente una volta e passarlo alle due funzioni. |
| B7 | Nessun layer di caching | Nessun Redis, nessun `functools.lru_cache` in tutto `app/`. Dati quasi statici come `list_reparti` colpiscono il DB a ogni richiesta. | 🟢 | Basso rischio dato il volume (reparti = poche righe per natura del dominio). |

## Non fatto (fuori scope di questo giro)

- Batch 🟢 (F3, F4, F5, B3, B4, B5, B6, B7) non applicato — resta backlog,
  basso impatto col volume dati attuale.
- Nessun test di carico/concorrenza (i problemi di pool sizing sono oggi
  latenti col dataset dev piccolo, non misurati sotto stress).
- Nessuna verifica specifica su Postgres — il DB dev/e2e gira su SQLite
  (`DATABASE_URL` di default), quindi B4 (pool config) resta teorico finché
  non si cambia backend DB.
- Lighthouse eseguito solo su `/login` (unica route pubblica senza auth);
  le altre view (dashboard, scheda paziente) richiederebbero un flusso di
  login automatizzato per essere misurate allo stesso modo — non fatto in
  questo giro.

## Fix applicate (batch 🟡, stesso giorno)

Tutte verificate: 84/84 test backend passano, `ruff check` pulito, 120/120
test frontend passano, `vue-tsc --noEmit` pulito, build produzione pulita.

- **F1** — `src/views/infermiere/DashboardView.vue`: `TurniCalendarCard`
  ora importato via `defineAsyncComponent(() => import(...))` invece di
  import statico. Verificato col rebuild: chunk dashboard infermiere
  233.70 KB → 5.81 KB; FullCalendar isolato in un chunk lazy separato
  (`TurniCalendarCard-*.js`, 228.43 KB) caricato solo quando la vista monta
  il calendario.
- **F2** — `src/features/dashboard/useInfermiereDashboard.ts`: `listConsegneSbar()`
  → `listConsegneSbar({ limit: 5 })`, rimosso lo `.slice(0, 5)` client-side.
- **B1** — aggiunto `index=True` sulle colonne FK/status filtrate di
  frequente: `Turno.reparto_id`, `AssegnazioneTurno.infermiere_id`/`stato`,
  `Paziente.reparto_id`, `Utente.reparto_id`, `ConsegnaSbar.turno_id`,
  `RichiestaCambioTurno.assegnazione_turno_id`/`richiedente_id`/`collega_id`/`stato`,
  `RichiestaFerie.infermiere_id`/`stato`, `ValutazioneNorton.paziente_id`,
  `ValutazioneConley.paziente_id`, `VoceDiarioCedema.paziente_id`. Verificato
  su una copia throwaway del DB dev con gli indici creati manualmente:
  `EXPLAIN QUERY PLAN` passa da `SCAN turno`/`SCAN assegnazione_turno` a
  `SEARCH ... USING INDEX`. ⚠️ Il progetto non usa Alembic (schema creato via
  `Base.metadata.create_all` all'avvio) — gli indici si applicano solo a un
  DB creato da zero. Il DB dev attuale (`consegne_infermieristiche.db`) va
  ricreato (`scripts/seed_mock_data.py`) perché gli indici prendano effetto
  — **non fatto automaticamente**, richiede conferma esplicita perché lo
  script fa wipe+recreate dell'intero DB dev.
- **B2** — `app/routers/ferie.py`: aggiunta `_to_read_batch()`, usata da
  `list_richieste` al posto di `[_to_read(db, r) for r in richieste]`. Una
  sola query `richiesta_id.in_(...)` per tutte le preferenze invece di una
  per richiesta; raggruppamento in Python via dict. Le altre chiamate a
  `_to_read()` (create/update, singola riga) non toccate.
