# Design System: Eira
**Skill:** stitch-design-taste (tarata su software clinico, non default landing-page)

---

## Principio guida — Anti-AI-Generated

Questo non è un design consumer/marketing: è software clinico usato da
infermieri e capo-sala, spesso in turno notte, sotto stress operativo.
Ogni scelta sotto serve leggibilità e velocità di lettura, non impatto
estetico. Le regole anti-pattern (sez. 9) non sono un'appendice — sono
il criterio con cui giudicare ogni schermata: se una schermata sembra
generata da un tool AI generico (font default, layout simmetrico
piatto, card iper-arrotondate, copy motivazionale vuoto), è sbagliata.

## Configurazione — Dial

| Dial | Livello | Motivazione |
|------|---------|-------------|
| **Creativity** | `3` | Pulito, quasi Notion-like. Niente sperimentazione editoriale/tipografica che rallenta lettura in emergenza |
| **Density** | `6` | Dashboard e tabelle dense: turni, pazienti, consegne — non whitespace da landing page |
| **Variance** | `3` | Prevedibile, layout coerente reparto per reparto — no caos artsy |
| **Motion Intent** | `3` | Sobrio. Micro-loop perenni banditi salvo eccezione unica (sez. 8) |

Target d'uso: infermieri/capo-sala, turno notte, stress operativo,
**desktop/tablet reparto come target primario** (mobile responsive ma
non priorità — a differenza del mobile-first di default della skill).

## 1. Visual Theme & Atmosphere

Un'interfaccia clinica calma e prevedibile: densità dashboard reale
(tabelle turni/pazienti, non gallerie), variance bassa che rende ogni
reparto/vista riconoscibile allo stesso modo, motion quasi assente
salvo un singolo indicatore live. L'impressione generale: strumento
professionale affidabile, leggibile anche alle 3 di notte con luce
bassa — non un prodotto consumer.

## 2. Color Palette & Roles

Tema **light e dark obbligatori entrambi** (non solo light) — turno
notte/luce ambientale bassa richiede una modalità scura reale, non un
filtro accessorio.

### Light mode
- **Canvas White** (`#F9FAFB`) — sfondo primario, warm-neutral
- **Pure Surface** (`#FFFFFF`) — fill tabelle/stat tile
- **Charcoal Ink** (`#18181B`) — testo primario, Zinc-950 — mai nero puro
- **Steel Secondary** (`#71717A`) — testo secondario, metadata
- **Muted Slate** (`#94A3B8`) — testo terziario, timestamp, disabled
- **Whisper Border** (`rgba(226,232,240,0.5)`) — bordi tabella/divider

### Dark mode
- **Canvas Dark** (`#18181B`) — sfondo primario, Zinc-950 — mai nero puro (`#000000`)
- **Surface Dark** (`#27272A`) — fill tabelle/stat tile, Zinc-800
- **Ink Light** (`#F4F4F5`) — testo primario, Zinc-100
- **Steel Secondary Dark** (`#A1A1AA`) — testo secondario, Zinc-400
- **Muted Slate Dark** (`#71717A`) — testo terziario, timestamp, disabled
- **Whisper Border Dark** (`rgba(255,255,255,0.08)`) — bordi tabella/divider

### Accent — colore primario (unico, swappabile)
- **Electric Blue** (`#3B82F6`) — CTA, stati attivi, focus ring. Dichiarato
  come variabile CSS dedicata (`--color-primary`), non hardcoded sparso
  nei componenti — così resta facilmente sostituibile in futuro senza
  toccare ogni file.
  - Dark mode: stesso hue, leggermente desaturato/schiarito (`#60A5FA`)
    per non abbagliare su sfondo scuro.

### Banned Colors
- Purple/Violet neon gradients ("AI Purple")
- Nero puro (`#000000`) — sempre Off-Black/Zinc-950
- Accenti oversaturati sopra l'80%
- Sistemi grigio caldo/freddo misti nello stesso progetto

## 3. Colori di Stato (semantici, separati dall'accent)

Usati per SBAR priorità, stati `RichiestaCambioTurno`,
`AssegnazioneTurno`. Desaturati — feedback chiaro, non semaforo acceso.

| Stato | Light | Dark | Uso |
|---|---|---|---|
| **Urgente / Rifiutata** | `#DC2626` (Red 600) | `#F87171` (Red 400) | SBAR priorità urgente, cambio turno rifiutato |
| **In attesa / Pending** | `#D97706` (Amber 600) | `#FBBF24` (Amber 400) | Richiesta in_attesa_collega / in_attesa_caposala |
| **Approvata / Attiva** | `#16A34A` (Green 600) | `#4ADE80` (Green 400) | Assegnazione attiva, cambio turno approvato |
| **Cambiata / Chiusa** | `#71717A` (Zinc 500) | `#A1A1AA` (Zinc 400) | Assegnazione cambiata, richiesta chiusa/storica |

## 4. Typography Rules

- **Display/Body:** `Geist` — track-tight su titoli/header sezione,
  peso 400 su body con leading rilassato (1.6), max 65ch. `Inter` bandito.
- **Mono:** `Geist Mono` — per orari turno, date, ID paziente, numeri
  banca ore, timestamp. A Density 6, tutti i numeri tabellari usano mono.
- **Serif:** bandito ovunque (regola dashboard-constraint della skill).
- **Scale:** Header sezione `1.5rem/700`, sotto-header `1.125rem/600`,
  body `0.9375rem/400`, mono metadata `0.8125rem`.

## 5. Component Stylings

- **Radius:** contenuto (`0.5–0.75rem`), non 2.5rem del default skill —
  look software professionale, non consumer app.
- **Ombre:** minime/quasi assenti (`0 1px 2px rgba(0,0,0,0.04)` max) —
  gerarchia data da bordi/spaziatura, non da elevazione drammatica.
- **Tabelle come pattern primario** per liste dense (pazienti, turni,
  consegne): righe con `border-top` divider, header sticky, zebra
  striping opzionale a Density 6. **Non** cards-per-riga.
- **Cards:** non usate nell'implementazione attuale — `EiraCard`/
  `EiraTable` restano sempre `flush` (nessun bordo/ombra/background) in
  ogni contesto. Le sezioni si distinguono per titolo + spaziatura, non
  per box. Liste/tabelle dense usano divider `border-top` tra
  righe/voci come unico elemento strutturale.
- **Buttons:** flat, no glow. Primary: fill accent, testo bianco.
  Secondary: outline/ghost. Active: `scale(0.98)` o `-1px translateY`.
- **Inputs/Forms:** label sopra, helper text opzionale, errore sotto in
  Rosso (sez. 3). Focus ring accent, offset 2px. No floating label.
- **Badge di stato:** pillola compatta, colore di sfondo desaturato +
  testo colore pieno (sez. 3), mai solo icona senza testo (SBAR/turni
  vanno letti a colpo d'occhio ma senza ambiguità daltonica).
- **Loading states:** skeleton shimmer solo se coerente con Motion 3
  (sez. 8) — non spinner circolari generici.
- **Empty states:** composizione chiara con azione di recupero
  ("Nessun turno assegnato — vai al calendario"), mai solo "No data".
- **Error states:** inline, Rosso, azione di recupero visibile.

## 6. Layout Principles

- CSS Grid per layout strutturali. Niente `calc()` percentuale.
- Contenimento `max-width: 1800px` centrato per viste dashboard
  (`--page-2xl`) — alzato da 1400px per non lasciare spazio morto
  eccessivo su monitor 2k/ultra-wide da reparto. Altre viste (tabelle
  liste, form) restano su `--page-xl` (1400px).
- `min-height: 100dvh` per sezioni full-height — mai `100vh`.
- Sidebar/nav laterale per navigazione ruolo (infermiere/caposala) —
  non hero, non landing-style: la prima vista dopo login è già
  dashboard operativa, non una schermata di benvenuto.
- No "3 card uguali in riga" per feature — non applicabile qui (non
  c'è una feature-section marketing), ma resta bandito se si costruisce
  qualunque riepilogo a card.

## 7. Responsive Rules

Target primario **desktop/tablet reparto** (non mobile-first come
default skill) — ma niente si rompe sotto i viewport standard:

- **Desktop (≥1024px):** layout primario, sidebar fissa + contenuto,
  tabelle a piena larghezza colonne.
- **Tablet (768–1023px):** sidebar collassabile a icone, tabelle con
  scroll orizzontale contenuto (mai overflow di pagina).
- **Mobile (<768px):** supportato ma non ottimizzato per uso primario
  (caso d'uso: consulta rapida turno da telefono) — layout
  single-column, tabelle → liste verticali per riga.
- Touch target minimo 44px ovunque (anche desktop, per tablet reparto
  con touchscreen).
- Nessuno scroll orizzontale di pagina in nessun viewport.

## 8. Motion & Interaction

Motion Intent 3 — sobrio, quasi assente. **Divergenza esplicita dal
default della skill**, che impone loop perenni su ogni componente
attivo: qui è bandito di default.

- **Bandito:** shimmer/float/typewriter/pulse decorativi ovunque non
  esplicitamente autorizzato sotto.
- **Unica eccezione permessa:** un pulse discreto e a bassa frequenza
  (`2s` ciclo, opacità 0.6→1→0.6) sul pallino di stato quando è
  realmente "live/in attesa" — es. `in_attesa_collega` su
  `RichiestaCambioTurno`. Nessun altro elemento anima in loop.
- **Transizioni puntuali:** hover/focus/click usano transizioni brevi
  (150–200ms, ease-out), non spring physics teatrali.
- **Performance:** anima solo `transform`/`opacity`. Mai `top`/`left`/
  `width`/`height`.

## 9. Anti-Patterns (Banned)

- No emoji ovunque
- No `Inter`, no font serif generici
- No nero puro (`#000000`)
- No glow neon o box-shadow vistose
- No accenti oversaturati (>80%)
- No gradient text vistosi
- No cursori mouse custom
- No elementi sovrapposti — ogni elemento nella sua zona spaziale
- No card-per-riga per liste dense (usa tabelle, sez. 5)
- No hero da landing page — la prima vista è dashboard operativa
- No testo filler ("Scroll to explore", frecce che rimbalzano ecc.)
- No nomi generici nei mock ("John Doe", "Mario Rossi" va bene come
  dato di test realistico, ma non "Utente Test", "Paziente 1")
- No numeri finti tondi (`100%`, `50 ore`) — usa dati organici (`47.5
  ore`, `92.3%`)
- No cliché di copy AI ("Elevate", "Seamless", "Rivoluziona")
- No loop di animazione perenni fuori dall'unica eccezione (sez. 8)
- No spinner circolari generici
- No `z-index` spam — solo per nav/modal/overlay
- No `h-screen` — sempre `min-h-[100dvh]`
