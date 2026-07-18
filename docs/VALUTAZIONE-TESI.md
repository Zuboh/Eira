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
  doppia conferma, banca ore, ferie (WIP non committato, v. nota sotto).
- 80 test backend passanti (era 33 al 2026-07-09; salita da feature ferie +
  estensioni SBAR/cambi turno, tutte **non ancora committate** — solo working
  tree). Zero test frontend. Nessuna CI, nessun lint configurato (né backend
  né frontend, verificato di nuovo oggi).
- Due bug 🔴 aperti, due 🟡 aperti (v. `TASK.md` / `docs/SECURITY.md` §3) —
  stato invariato, nessun fix nel working tree attuale.
- ⚠️ **~50 file modificati/aggiunti non committati** nel working tree
  (feature ferie completa: modelli/router/schema/test backend + calendar
  card/view frontend, oltre a modifiche sparse su sbar/cambi-turno/staff).
  Rischio concreto di perdita lavoro finché resta non committato.
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

- **Backend: 28/30.** Test reali (80, passanti — ma per ora solo in working
  tree, non committati) danno verifica empirica, non
  solo dichiarata. Modello di dominio solido, invariante di isolamento
  reparto applicata sistematicamente, audit trail storico dei fix di
  sicurezza. I due 🔴 sono concreti ma circoscritti e già diagnosticati con
  precisione (file/righe). Manca CI/lint per essere quasi ineccepibile.
- **Frontend: 25/30.** Architettura il punto più forte — moduli
  feature-based, composition roots leggeri, design tokens, accessibilità
  manuale (aria-label, focus, overflow tabelle) — sopra lo standard
  triennale. Ma zero verifica empirica: zero test, zero lint/CI, e alcune
  viste esplicitamente **non verificate end-to-end** (creazione Norton/
  Conley, cambio turno con secondo account, banca ore solo da code review).

Differenza chiave tra i due: il backend ha verifica empirica (test) a
sostegno della qualità dichiarata, il frontend ha qualità architetturale ma
verifica solo manuale/dichiarata.

## 4. Cosa manca per 30/30

### Backend

1. Fix dei due 🔴:
   - crash su `DELETE /turni/{id}/assegnazioni` (check richieste cambio
     turno pendenti prima della cancellazione, o `ondelete` sulle FK +
     `PRAGMA foreign_keys=ON`);
   - isolamento reale del DB di test (engine dedicato in-memory in
     `conftest.py`, non quello di produzione).
2. Fix dei due 🟡:
   - assegnare `StatoAssegnazione.cambiata` nello swap turno;
   - decidere/implementare se il gate "turno attivo" va ristretto a "turno
     di oggi".
3. Lint/format: Ruff (+ eventualmente mypy), da far girare in CI.
4. CI: GitHub Action che esegue `PYTHONPATH=. uv run pytest` ad ogni
   push/PR.
5. Hardening JWT/secret (dettaglio §5).

### Frontend

1. Test: zero oggi. Unit test sui composable critici (`useLoginFlow`,
   `useCaposalaDashboard`, `usePatientChart`) con Vitest; idealmente 3-4
   test e2e Playwright sui flussi chiave (login, consegna SBAR, cambio
   turno, assegnazione turno scoperto).
2. Verificare end-to-end le viste segnate come non verificate in `TASK.md`:
   creazione Norton/Conley, cambio turno con secondo account infermiere,
   banca ore.
3. Lint/CI: ESLint + Prettier, in CI insieme a
   `npm run typecheck && npm run build`.
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
  reale se il deploy dimentica di sovrascriverlo via env var. Fix a basso
  costo: check a startup in `main.py`/`core/config.py` — se una variabile
  tipo `environment=production` è impostata e il secret è ancora quello di
  default, rifiutare l'avvio invece di partire silenziosamente insicuro.
  Poche righe, alto segnale ("fail fast on insecure config").
- **Refresh token assente**: raccomandazione è **non implementarlo**.
  Aggiungerlo introduce storage/rotazione/revoca lato server e superficie
  di attacco in più, per un'app dove il turno tipico dura 6-8h e il token
  scade a 8h — la sessione JWT coincide già col turno di lavoro. Meglio
  argomentare nel report che l'assenza di refresh token è una scelta di
  design coerente col dominio (fine sessione = fine turno, dispositivo
  condiviso di reparto), non una lacuna.

Per il punto 5 backend: un piccolo check di startup da implementare, e una
frase da scrivere nel report per l'altro — non serve altro codice.

### Frontend — audit di accessibilità automatico

Due strade:

- **`@axe-core/playwright`** agganciato agli stessi e2e già in programma
  (punto 1): per ogni pagina chiave (login, dashboard, scheda paziente,
  consegne SBAR) chiamare `AxeBuilder(page).analyze()` e asserire zero
  violazioni. Costo basso se i test e2e esistono già (stesso setup
  Playwright riusato). Dà un claim concreto e citabile nel report ("0
  violazioni automatiche su N pagine chiave").
- **Lighthouse CI** (categoria accessibility): più leggero da configurare,
  ma dà un punteggio invece di un'asserzione pass/fail — meno rigoroso da
  citare ma meno codice.

Nota di rischio comune: PrimeVue a volte genera falsi positivi su contrasto
colore nei suoi componenti interni — va messo in conto qualche
`exclude`/tuning delle regole.

Raccomandazione: axe-core dentro ai Playwright e2e — stesso investimento del
punto 1 test coverage, ritorno doppio.

## 6. Prossimi passi possibili (da scegliere, non decisi)

- **Committare il working tree ferie** (~50 file, 80 test già passanti) —
  priorità sopra le altre, lavoro reale non al sicuro finché resta locale.
- Implementare il check di startup JWT sul backend.
- Scaffolding Playwright (e2e + axe) sul frontend.
- Fix dei due bug 🔴.
- Scaletta del report (Parte Prima + Seconda).
