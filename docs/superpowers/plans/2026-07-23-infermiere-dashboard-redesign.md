# Infermiere Dashboard Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `views/infermiere/DashboardView.vue` so the calendar shares row 1 with turno/banca-ore data instead of sitting alone as a full-width hero, kill the "boxed stat tile" and "table nested inside a card" double-framing pattern, flatten the calendar's own header, and add a month/year picker to the calendar title.

**Architecture:** Six focused Vue SFC edits: a shared `EiraTable` prop (`flush`) that removes its own frame when nested in a card, a ledger-row restyle of `BancaOreSection`, three edits to `TurniCalendarCard` (card wrap, month picker, font audit), and a layout edit to `DashboardView`. No new dependencies — `Popover` already ships with the installed `primevue@^4.5.5`.

**Tech Stack:** Vue 3 `<script setup>` + TypeScript, PrimeVue 4 (Aura preset, already configured in `main.ts`), scoped CSS using the app's existing design tokens (`frontend/src/style.css`).

**Test note:** None of the six files touched here have existing unit/component tests (`npm run test` covers composables/view-models only — `useInfermiereDashboard.spec.ts`, `useBancaOre.spec.ts`, etc. — not presentational `.vue` files). This matches the project's established pattern for pure layout/CSS work: verify with `npm run typecheck`, `npm run build`, and a Playwright visual check (light+dark, 1400px+2560px), not new unit tests. Task 8 covers that verification pass.

---

### Task 1: `EiraTable` — add a `flush` variant that drops its own frame

**Files:**
- Modify: `frontend/src/components/ui/EiraTable.vue`

- [ ] **Step 1: Add the `flush` prop**

In `frontend/src/components/ui/EiraTable.vue`, replace the existing `withDefaults` call (lines 2–15) with:

```ts
withDefaults(
  defineProps<{
    empty?: boolean
    emptyMessage?: string
    loading?: boolean
    loadingRows?: number
    flush?: boolean
  }>(),
  {
    empty: false,
    emptyMessage: 'Nessun dato da mostrare',
    loading: false,
    loadingRows: 4,
    flush: false,
  },
)
```

- [ ] **Step 2: Bind the class on the root section**

Replace line 19:

```html
<section class="eira-table" :class="{ 'eira-table--empty': empty }">
```

with:

```html
<section
  class="eira-table"
  :class="{ 'eira-table--empty': empty, 'eira-table--flush': flush }"
>
```

- [ ] **Step 3: Add the flush override CSS**

In the `<style scoped>` block, right after the `.eira-table__skeleton` rule (after line 124's closing `}`), add:

```css
.eira-table--flush .eira-table__scroll,
.eira-table--flush .eira-table__empty,
.eira-table--flush .eira-table__skeleton {
  border: none;
  box-shadow: none;
  background: transparent;
  border-radius: 0;
}
```

- [ ] **Step 4: Typecheck**

Run: `cd /Users/zubo/Projects/eira/frontend && npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/zubo/Projects/eira
git add frontend/src/components/ui/EiraTable.vue
git commit -m "feat(eira-table): add flush variant to drop frame when nested in a card"
```

---

### Task 2: Single-frame rule — apply `flush` to the three dashboard table cards

**Files:**
- Modify: `frontend/src/features/dashboard/components/PazientiAttiviCard.vue:18`
- Modify: `frontend/src/features/dashboard/components/ConsegneRecentiCard.vue:19`
- Modify: `frontend/src/features/dashboard/components/CarelloBassoStockCard.vue:35`

- [ ] **Step 1: `PazientiAttiviCard.vue`**

Replace:

```html
    <EiraTable
      :loading="loading"
      :empty="pazienti.length === 0"
      empty-message="Nessun paziente in reparto."
    >
```

with:

```html
    <EiraTable
      flush
      :loading="loading"
      :empty="pazienti.length === 0"
      empty-message="Nessun paziente in reparto."
    >
```

- [ ] **Step 2: `ConsegneRecentiCard.vue`**

Replace:

```html
    <EiraTable
      :loading="loading"
      :empty="consegne.length === 0"
      empty-message="Nessuna consegna registrata."
    >
```

with:

```html
    <EiraTable
      flush
      :loading="loading"
      :empty="consegne.length === 0"
      empty-message="Nessuna consegna registrata."
    >
```

- [ ] **Step 3: `CarelloBassoStockCard.vue`**

Replace:

```html
    <EiraTable
      :loading="loading"
      :empty="alertRows.length === 0"
      empty-message="Nessun farmaco sotto soglia."
    >
```

with:

```html
    <EiraTable
      flush
      :loading="loading"
      :empty="alertRows.length === 0"
      empty-message="Nessun farmaco sotto soglia."
    >
```

- [ ] **Step 4: Typecheck**

Run: `cd /Users/zubo/Projects/eira/frontend && npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/zubo/Projects/eira
git add frontend/src/features/dashboard/components/PazientiAttiviCard.vue \
        frontend/src/features/dashboard/components/ConsegneRecentiCard.vue \
        frontend/src/features/dashboard/components/CarelloBassoStockCard.vue
git commit -m "fix(dashboard): remove double card+table framing on Pazienti/Diario/Carello"
```

---

### Task 3: `BancaOreSection` — ledger-row stat style

**Files:**
- Modify: `frontend/src/features/banca-ore/components/BancaOreSection.vue`

- [ ] **Step 1: Remove the now-unused `EiraCard` import**

Replace line 4:

```ts
import EiraCard from '@/components/ui/EiraCard.vue'
```

Delete it entirely (no other usage of `EiraCard` remains in this file after Step 2).

- [ ] **Step 2: Replace the tiles markup with a ledger**

Replace lines 68–84:

```html
    <div v-if="bancaOre" class="tiles">
      <EiraCard class="tile">
        <span class="tile-label">Ore effettuate</span>
        <span class="tile-value mono">{{ bancaOre.ore_effettuate }}</span>
      </EiraCard>
      <EiraCard class="tile">
        <span class="tile-label">Ore contrattuali</span>
        <span class="tile-value mono">{{ bancaOre.ore_contrattuali }}</span>
      </EiraCard>
      <EiraCard
        class="tile"
        :class="{ negative: bancaOre.saldo < 0, positive: bancaOre.saldo >= 0 }"
      >
        <span class="tile-label">Saldo</span>
        <span class="tile-value mono">{{ saldoLabel() }}</span>
      </EiraCard>
    </div>
```

with:

```html
    <div v-if="bancaOre" class="ledger">
      <div class="ledger-row">
        <span class="ledger-label">Ore effettuate</span>
        <span class="ledger-value mono">{{ bancaOre.ore_effettuate }}</span>
      </div>
      <div class="ledger-row">
        <span class="ledger-label">Ore contrattuali</span>
        <span class="ledger-value mono">{{ bancaOre.ore_contrattuali }}</span>
      </div>
      <div class="ledger-row" :class="{ negative: bancaOre.saldo < 0 }">
        <span class="ledger-label">Saldo</span>
        <span class="ledger-value mono">{{ saldoLabel() }}</span>
      </div>
    </div>
```

- [ ] **Step 3: Replace the tile CSS with ledger CSS**

Replace lines 141–172:

```css
.tiles {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.tile {
  flex: 1 1 12rem;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tile-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--steel);
}

.tile-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ink);
}

.tile.positive .tile-value {
  color: var(--state-attiva);
}

.tile.negative .tile-value {
  color: var(--state-urgente);
}
```

with:

```css
.ledger {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.ledger-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
}

.ledger-row + .ledger-row {
  border-top: 1px solid var(--border);
}

.ledger-label {
  font-size: 0.8125rem;
  color: var(--steel);
}

.ledger-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--ink);
}

.ledger-row.negative .ledger-value {
  color: var(--state-urgente);
}
```

(The `.mono { font-family: var(--mono); }` rule below stays untouched — `ledger-value` still uses the `mono` class in the template.)

- [ ] **Step 4: Typecheck**

Run: `cd /Users/zubo/Projects/eira/frontend && npm run typecheck`
Expected: no errors (confirms the removed `EiraCard` import isn't referenced anywhere else in the file).

- [ ] **Step 5: Commit**

```bash
cd /Users/zubo/Projects/eira
git add frontend/src/features/banca-ore/components/BancaOreSection.vue
git commit -m "feat(banca-ore): replace boxed stat tiles with ledger-row style"
```

---

### Task 4: `TurniCalendarCard` — single card frame, strip FullCalendar's own outer border

**Context:** `TurniCalendarCardSkeleton.vue` already wraps its loading state in `<EiraCard title="Calendario turni">`, but the real `TurniCalendarCard.vue` has no card wrapper at all — a mismatch between loading and loaded state, and the reason there's no single clean frame to remove a "boxed header" from in the first place. This task fixes both: wraps the real component in `EiraCard` (matching the skeleton) and removes FullCalendar's own default `.fc-scrollgrid` border so there's exactly one frame, not two.

**Files:**
- Modify: `frontend/src/features/dashboard/components/TurniCalendarCard.vue`

- [ ] **Step 1: Import `EiraCard`**

Add to the import block (after line 8):

```ts
import EiraCard from '@/components/ui/EiraCard.vue'
```

- [ ] **Step 2: Wrap the root in `EiraCard`**

Replace line 147 (`<section class="turni-calendar-card">`) with:

```html
  <EiraCard class="turni-calendar-card">
```

Replace line 215 (`</section>`) with:

```html
  </EiraCard>
```

- [ ] **Step 3: Strip FullCalendar's own outer border**

In the `<style scoped>` block, right after the `.turni-calendar-card :deep(.fc-day-today .fc-daygrid-day-frame)` rule (after line 239's closing `}`), add:

```css
.turni-calendar-card :deep(.fc-scrollgrid) {
  border: 0;
}
```

- [ ] **Step 4: Make toolbar buttons explicitly borderless/backgroundless**

Replace the `.calendar-toolbar-nav :deep(.p-button)` rule (lines 263–272):

```css
.calendar-toolbar-nav :deep(.p-button) {
  min-width: var(--size-touch);
  min-height: var(--size-touch);
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  font-family: var(--sans);
  font-size: 1.125rem;
  color: var(--ink);
  transition: color 0.15s ease-out;
}
```

with:

```css
.calendar-toolbar-nav :deep(.p-button) {
  min-width: var(--size-touch);
  min-height: var(--size-touch);
  padding: 0 var(--space-2);
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  font-family: var(--sans);
  font-size: 1.125rem;
  color: var(--ink);
  transition: color 0.15s ease-out;
}
```

- [ ] **Step 5: Typecheck**

Run: `cd /Users/zubo/Projects/eira/frontend && npm run typecheck`
Expected: no errors.

- [ ] **Step 6: Visual check — loading vs. loaded state now match**

Run: `npm run dev` (if not already running), open `http://localhost:5173/infermiere`, reload with network throttled (DevTools → Network → Slow 3G) to see the skeleton, confirm it now has the same single-border card frame as the loaded calendar (no more flash from "boxed skeleton" to "unboxed real content").

- [ ] **Step 7: Commit**

```bash
cd /Users/zubo/Projects/eira
git add frontend/src/features/dashboard/components/TurniCalendarCard.vue
git commit -m "fix(calendar): wrap in EiraCard for single frame, matching the loading skeleton"
```

---

### Task 5: `TurniCalendarCard` — clickable month title with year/month picker

**Files:**
- Modify: `frontend/src/features/dashboard/components/TurniCalendarCard.vue`

- [ ] **Step 1: Import `Popover` and add picker state**

Add to the imports (after the `Button` import, currently line 7):

```ts
import Popover from 'primevue/popover'
```

Add after the `currentTitle` ref declaration (currently line 40):

```ts
const monthPickerRef = ref<InstanceType<typeof Popover> | null>(null)
const pickerYear = ref(new Date().getFullYear())

const MESI_IT = [
  'Gen',
  'Feb',
  'Mar',
  'Apr',
  'Mag',
  'Giu',
  'Lug',
  'Ago',
  'Set',
  'Ott',
  'Nov',
  'Dic',
]
```

- [ ] **Step 2: Add picker functions**

Add after the existing `goNext` function (currently ends at line 69):

```ts
function toggleMonthPicker(domEvent: Event) {
  const api = calendarRef.value?.getApi()
  if (api) pickerYear.value = api.getDate().getFullYear()
  monthPickerRef.value?.toggle(domEvent)
}

function pickerPrevYear() {
  pickerYear.value -= 1
}

function pickerNextYear() {
  pickerYear.value += 1
}

function selectMonth(monthIndex: number) {
  calendarRef.value?.getApi().gotoDate(new Date(pickerYear.value, monthIndex, 1))
  monthPickerRef.value?.hide()
}
```

- [ ] **Step 3: Replace the title markup**

Replace line 149:

```html
        <h2 class="calendar-toolbar-title">{{ currentTitle }}</h2>
```

with:

```html
        <h2 class="calendar-toolbar-title-wrap">
          <button
            type="button"
            class="calendar-toolbar-title"
            aria-haspopup="true"
            :aria-label="`Cambia mese, mese corrente: ${currentTitle}`"
            @click="toggleMonthPicker"
          >
            {{ currentTitle }}
            <i class="pi pi-chevron-down calendar-toolbar-title-caret" aria-hidden="true" />
          </button>
        </h2>
```

- [ ] **Step 4: Add the popover after the toolbar's closing `</div>`**

Right after line 165 (the `</div>` that closes `.calendar-toolbar`), before the `<FullCalendar` tag (line 167), add:

```html
    <Popover ref="monthPickerRef">
      <div class="month-picker">
        <div class="month-picker-year">
          <Button
            text
            icon="pi pi-chevron-left"
            aria-label="Anno precedente"
            @click="pickerPrevYear"
          />
          <span class="month-picker-year-label mono">{{ pickerYear }}</span>
          <Button
            text
            icon="pi pi-chevron-right"
            aria-label="Anno successivo"
            @click="pickerNextYear"
          />
        </div>
        <div class="month-picker-grid">
          <button
            v-for="(label, index) in MESI_IT"
            :key="label"
            type="button"
            class="month-picker-cell"
            @click="selectMonth(index)"
          >
            {{ label }}
          </button>
        </div>
      </div>
    </Popover>
```

- [ ] **Step 5: Replace the title CSS, add popover CSS**

Replace the `.calendar-toolbar-title` rule (lines 248–255):

```css
.calendar-toolbar-title {
  margin: 0;
  font-family: var(--sans);
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--ink);
  text-transform: capitalize;
}
```

with:

```css
.calendar-toolbar-title-wrap {
  margin: 0;
}

.calendar-toolbar-title {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  font-family: var(--sans);
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--ink);
  text-transform: capitalize;
  cursor: pointer;
  transition: color 150ms ease-out;
}

.calendar-toolbar-title:hover {
  color: var(--color-primary);
}

.calendar-toolbar-title:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.calendar-toolbar-title-caret {
  font-size: 0.75rem;
  color: var(--steel);
}

.month-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px;
  min-width: 14rem;
}

.month-picker-year {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.month-picker-year-label {
  min-width: 3.5rem;
  text-align: center;
  font-weight: 600;
  color: var(--ink);
}

.month-picker-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}

.month-picker-cell {
  min-height: var(--size-touch);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--ink);
  font-family: var(--sans);
  font-size: 0.875rem;
  cursor: pointer;
  transition:
    background 150ms ease-out,
    color 150ms ease-out;
}

.month-picker-cell:hover {
  background: var(--canvas);
  color: var(--color-primary);
}

.month-picker-cell:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

- [ ] **Step 6: Typecheck**

Run: `cd /Users/zubo/Projects/eira/frontend && npm run typecheck`
Expected: no errors.

- [ ] **Step 7: Manual verification in browser**

With the dev server running, open `http://localhost:5173/infermiere`. Click the month title ("Luglio 2026"). Expected: a popover opens showing a 4×3 grid of month abbreviations (Gen…Dic) with year navigation above it. Click a different month — the calendar jumps to that month and the popover closes. Click the year `‹`/`›` arrows — only the picker's displayed year changes, not the calendar, until a month is clicked. Tab to the title with keyboard, press Enter — popover opens (PrimeVue `Popover` handles focus trapping/Escape-to-close by default).

- [ ] **Step 8: Commit**

```bash
cd /Users/zubo/Projects/eira
git add frontend/src/features/dashboard/components/TurniCalendarCard.vue
git commit -m "feat(calendar): add month/year picker to calendar title"
```

---

### Task 6: `TurniCalendarCard` — font audit fix

**Context:** `.fc { font-family: inherit }` (line 227–230) should cascade Geist down to every FullCalendar sub-element, and day numbers already force `var(--mono)` explicitly (line 283–286). But the weekday header labels (`lun`, `mar`, …) and event-chip titles (`Mattina`/`Pomeriggio`/…) have no explicit `font-family`, relying entirely on inheritance working correctly through FullCalendar's internal DOM — any FullCalendar-bundled rule with higher specificity would silently win. Make both explicit rather than relying on inheritance, removing the ambiguity regardless of root cause.

**Files:**
- Modify: `frontend/src/features/dashboard/components/TurniCalendarCard.vue`

- [ ] **Step 1: Force `var(--sans)` on the weekday header cushion**

Replace lines 288–292:

```css
.turni-calendar-card :deep(.fc-col-header-cell-cushion),
.turni-calendar-card :deep(.fc-daygrid-day-number) {
  color: var(--steel);
  text-decoration: none;
}
```

with:

```css
.turni-calendar-card :deep(.fc-col-header-cell-cushion),
.turni-calendar-card :deep(.fc-daygrid-day-number) {
  color: var(--steel);
  text-decoration: none;
}

.turni-calendar-card :deep(.fc-col-header-cell-cushion) {
  font-family: var(--sans);
  font-weight: 600;
}
```

- [ ] **Step 2: Force `var(--sans)` on the event chip title**

Replace the `.turno-event-title` rule (lines 317–321):

```css
.turni-calendar-card :deep(.turno-event-title) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

with:

```css
.turni-calendar-card :deep(.turno-event-title) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--sans);
}
```

- [ ] **Step 3: Verify computed styles in the browser**

With the dev server running, open `http://localhost:5173/infermiere`, open DevTools, and check the "Computed" panel for:
- a weekday header cell (e.g. the `lun` cell) → `font-family` should resolve to `Geist, system-ui, sans-serif` (not a browser default like `Arial`/`-apple-system` alone).
- a day number (e.g. `23`) → should resolve to `Geist Mono, ui-monospace, monospace`.
- an event chip title text (e.g. `Pomeriggio`) → should resolve to `Geist, system-ui, sans-serif`.

If any of the three doesn't resolve to the expected stack, the browser is falling back because the `Geist`/`Geist Mono` `@font-face` (declared at `style.css:1` and `style.css:9`) failed to load — check the Network tab for a 404 on `Geist-Variable.woff2` / `GeistMono-Variable.woff2` and fix the asset path before proceeding; that would be a separate, unrelated bug from this task's CSS specificity fix.

- [ ] **Step 4: Typecheck**

Run: `cd /Users/zubo/Projects/eira/frontend && npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/zubo/Projects/eira
git add frontend/src/features/dashboard/components/TurniCalendarCard.vue
git commit -m "fix(calendar): force explicit font-family on weekday header and event chip text"
```

---

### Task 7: `DashboardView.vue` — restructure row 1

**Files:**
- Modify: `frontend/src/views/infermiere/DashboardView.vue`

- [ ] **Step 1: Restructure the template**

Replace lines 44–76:

```html
  <div class="dashboard-infermiere">
    <PageHeader title="Dashboard Infermiere" />

    <InlineError :message="error" />

    <TurniCalendarCard class="calendar-hero" :events="calendarEvents" />

    <div class="dashboard-row dashboard-row--split">
      <ProssimiTurniCard :turni="prossimiTurniConColleghi" :loading="loading" />

      <BancaOreSection
        :banca-ore="bancaOre"
        :mese="bancaOreMese"
        :loading="bancaOreLoading"
        :error="bancaOreError"
        @previous-month="spostaBancaOreMese(-1)"
        @next-month="spostaBancaOreMese(1)"
      />
    </div>

    <div class="dashboard-row">
      <PazientiAttiviCard :pazienti="pazientiAttivi" :loading="loading" />

      <div class="side-column">
        <ConsegneRecentiCard
          :consegne="consegneRecenti"
          :loading="loading"
          :nome-paziente="nomePaziente"
        />

        <CarelloBassoStockCard :farmaci="farmaciCritici" :loading="loading" />
      </div>
    </div>
  </div>
```

with:

```html
  <div class="dashboard-infermiere">
    <PageHeader title="Dashboard Infermiere" />

    <InlineError :message="error" />

    <div class="dashboard-row">
      <TurniCalendarCard class="calendar-hero" :events="calendarEvents" />

      <div class="side-column">
        <ProssimiTurniCard :turni="prossimiTurniConColleghi" :loading="loading" />

        <BancaOreSection
          :banca-ore="bancaOre"
          :mese="bancaOreMese"
          :loading="bancaOreLoading"
          :error="bancaOreError"
          @previous-month="spostaBancaOreMese(-1)"
          @next-month="spostaBancaOreMese(1)"
        />
      </div>
    </div>

    <div class="dashboard-row">
      <PazientiAttiviCard :pazienti="pazientiAttivi" :loading="loading" />

      <div class="side-column">
        <ConsegneRecentiCard
          :consegne="consegneRecenti"
          :loading="loading"
          :nome-paziente="nomePaziente"
        />

        <CarelloBassoStockCard :farmaci="farmaciCritici" :loading="loading" />
      </div>
    </div>
  </div>
```

- [ ] **Step 2: Drop the now-unused `--split` grid variant**

Replace lines 94–103:

```css
.dashboard-row {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(20rem, 1fr);
  gap: 24px;
  align-items: start;
}

.dashboard-row--split {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}
```

with:

```css
.dashboard-row {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(20rem, 1fr);
  gap: 24px;
  align-items: start;
}
```

- [ ] **Step 3: Typecheck and build**

Run: `cd /Users/zubo/Projects/eira/frontend && npm run typecheck && npm run build`
Expected: both succeed with no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/zubo/Projects/eira
git add frontend/src/views/infermiere/DashboardView.vue
git commit -m "feat(dashboard): calendar shares row 1 with Prossimi Turni / Banca Ore"
```

---

### Task 8: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Typecheck and build the whole frontend**

Run: `cd /Users/zubo/Projects/eira/frontend && npm run typecheck && npm run build`
Expected: both succeed with no errors.

- [ ] **Step 2: Playwright visual check — light mode, 1400px**

With the dev server running (`http://localhost:5173`), resize the browser to 1400×900, navigate to `/infermiere`, take a full-page screenshot. Confirm:
- Row 1 = calendar (~2/3 width, flat header, no visible border/background behind "Luglio 2026"/"Oggi ‹ ›") + a narrow column with Prossimi Turni above Banca Ore.
- Banca Ore renders as a single bordered ledger (3 rows, no separate boxes), saldo negative in red text only.
- Pazienti in reparto / Diario Clinico / Carello Farmaci: one border around each section (the card), no second border around the table inside it.

- [ ] **Step 3: Playwright visual check — dark mode, 1400px**

Toggle dark mode (however the app exposes it — check `AppShell.vue`/a theme store if unclear), repeat the same screenshot and the same checklist. Pay particular attention to the ledger's red saldo text and the calendar's `--fc-day-today` highlight — both use `color-mix`/token values that must stay legible against the dark surface.

- [ ] **Step 4: Playwright visual check — 2560px (ultra-wide)**

Resize to 2560×1440, repeat. Confirm the `--page-2xl` (1800px) max-width container still centers correctly and the row-1 grid (`minmax(0, 2fr) minmax(20rem, 1fr)`) doesn't leave the narrow column awkwardly stretched.

- [ ] **Step 5: Contrast check on the ledger's negative-value red**

Using DevTools' contrast checker (or `browser_evaluate` with `getComputedStyle`), confirm `--state-urgente` red text (`#DC2626` light / `#F87171` dark, per `style.css`) against the ledger row's background (`var(--surface)` light / dark) passes WCAG AA (4.5:1) at the `1.25rem/700` size used for `.ledger-value`.

- [ ] **Step 6: No console errors**

Check `browser_console_messages` (or DevTools console) across all three viewport/theme checks above — no new errors introduced by the month picker or the `EiraCard`-wrapped calendar.

- [ ] **Step 7: Report status**

No commit for this task (verification only). If any check fails, fix it as part of the relevant earlier task and re-run this task's checklist — do not leave a known-broken state committed.
