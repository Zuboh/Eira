# Infermiere Dashboard — structural redesign

## Context

`views/infermiere/DashboardView.vue` got a layout/token pass in the prior session (calendar promoted to full-width hero row, `--page-2xl` container). User reviewed the live result and rejected the structure: calendar-as-solo-hero pushes urgent/actionable data (Diario Clinico urgenze, Carello Farmaci basso-stock, Pazienti in reparto) below the fold, contradicting PRODUCT.md's own bar ("si legge in 2 secondi a fine turno notte"). Stat tiles (Banca Ore) and card/table nesting also read as generic AI-dashboard boilerplate.

This spec covers the dashboard's structure only. `LoginView.vue`/`features/session/*` and `AppShell.vue` sidebar remain frozen reference points (see `/Users/zubo/.claude/plans/eira-full-project-redesign-plan.md`) — not touched here.

## Decisions (validated via visual-companion mockups this session)

### 1. Row 1 layout
Calendar stays the visual anchor but no longer occupies the row alone. Row 1 = calendar (~2/3 width) + narrow right column stacked with `ProssimiTurniCard` on top, `BancaOreSection` below. Row 2 (Pazienti in reparto / Diario Clinico / Carello Farmaci, 3-col) is unchanged from the current implementation.

### 2. Stat tile style — ledger row, not boxed cards
Applies to `BancaOreSection.vue` and any other stat-tile display reused elsewhere (dashboard counters, patient counts, etc.) — this is a shared visual pattern, not a one-off for Banca Ore.

- Single bordered container (1px `var(--border)`, `border-radius` per DESIGN.md §5, no shadow).
- Each metric is a row: label left (`var(--sans)`, `--steel`), value right (`var(--mono)`, bold, larger size).
- Rows separated by a thin top-border divider, no per-metric boxing.
- Negative/warning values (e.g. saldo banca ore negativo) get red text (`--state-urgente` family) — no colored background fill, text color carries the signal (still paired with the number itself, not color-only, satisfying PRODUCT.md's daltonismo rule).

### 3. Calendar toolbar header — flat, no nested box
Current: `.calendar-toolbar` sits in a bordered/background strip above the grid (box-in-a-box against the card's own border). New: strip the background + border-bottom from the toolbar row — title and nav controls sit directly on the card surface, matching the "flat calendar header" mockup approved this session.

### 4. Single-frame rule for table-in-card sections
Applies globally wherever a table lives inside a card: Pazienti in reparto, Diario Clinico recenti, Carello Farmaci here, plus the same pattern anywhere else in the app (Staff, Ferie, CambioTurno tables, etc. — out of scope to touch today, but note the rule for when those views get their pass per the tiered plan).

- Keep exactly one frame: the outer card (`border` + `border-radius`, no shadow beyond DESIGN.md's minimal spec).
- Remove the table's own border/box — header row keeps a bottom rule, data rows keep `border-top` dividers per DESIGN.md §5, but nothing boxes the table separately from its card.

### 5. Calendar month picker
`.calendar-toolbar-title` (currently static text, "Luglio 2026") becomes an interactive control: click opens a lightweight popover (not a native `<select>` — keep it on-brand, PrimeVue overlay component to match the rest of the app's form controls) showing a 12-month grid for the current year plus prev/next-year arrows, to jump directly to any month. Existing ‹ › single-step nav stays alongside it. Styling stays flat/ghost — no pill or border by default, ghost-hover (color change only, no background fill) matching the existing toolbar-button and sidebar `.nav-link:hover` precedent. Small caret or similar minimal affordance so it reads as clickable without adding a box.

### 6. Calendar font audit (bug, not a design choice)
`TurniCalendarCard.vue` declares `.fc { font-family: inherit }` but FullCalendar's bundled CSS likely wins on specific sub-elements with higher selector specificity (day-of-week header cells, event chip text) — computed font may not actually be `var(--sans)`/`var(--mono)` everywhere despite the stated intent at :228, :250, :268, :284. During implementation: inspect computed styles on every FullCalendar sub-element (`.fc-col-header-cell-cushion`, `.fc-daygrid-day-number`, `.fc-event-title`/`.turno-event-title`, toolbar) and force the correct token explicitly rather than relying on inheritance.

## Out of scope

- Any other view (caposala dashboard, patient chart, tables elsewhere) — covered by the tiered plan in `eira-full-project-redesign-plan.md`, not this spec.
- Mobile/tablet layout changes beyond what naturally follows from the row-1 restructure (existing responsive breakpoints in `DashboardView.vue`/`TurniCalendarCard.vue` should be re-verified, not redesigned).
- Login/sidebar — frozen.

## Verification

- `npm run typecheck`, `npm run build`.
- Playwright visual check, light + dark, 1400px and 2560px viewports (matches prior session's convention).
- Computed-style check confirming calendar sub-elements actually resolve to `var(--sans)`/`var(--mono)`, not a FullCalendar default.
- Contrast check on the ledger's negative-value red text against both light and dark card backgrounds (WCAG AA, per PRODUCT.md baseline).
