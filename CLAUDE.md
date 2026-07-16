# CLAUDE.md — Eira Development Guide

Use this file when working in this repository with Claude Code or another coding agent.

## Project context

Eira is a full-stack nursing handover app for a university project.

- Backend: FastAPI + SQLite + JWT.
- Frontend: Vue 3 + Vite + TypeScript + Pinia + PrimeVue.
- Frontend architecture guide: `docs/FRONTEND-ARCHITECTURE.md`.
- Backend architecture guide: `docs/BACKEND-ARCHITECTURE.md`.
- Current task tracker: `TASK.md`.
- Data-fetching decision: `docs/adr/0003-openapi-fetch-vs-axios.md` and `docs/FETCHING.md`.

## Hard rules

1. **Preserve user work.** Check `git status --short` before editing. Do not revert unrelated changes.
2. **Keep personal/reusable agent skills out of the repo** unless explicitly requested. Repo instructions belong in `CLAUDE.md`, `AGENTS.md`, or docs.
3. **Prefer small vertical slices.** Each change should compile independently.
4. **Do not reintroduce axios** in the frontend. Frontend API modules use `openapi-fetch` through `frontend/src/api/eiraClient.ts`.
5. **Do not bypass backend authorization.** Frontend role checks are UX; backend remains the security boundary.
6. **Do not silently change domain behavior.** If a refactor changes workflow semantics, call it out before/after.
7. **Do not commit backend changes together with frontend refactors** unless the task explicitly spans both.

## Verification commands

Frontend:

```bash
cd frontend
npm run typecheck
npm run build
```

Backend:

```bash
cd backend
PYTHONPATH=. uv run pytest
```

Full app dev:

```bash
./dev.sh
```

If a command fails because of local environment, dependency, network, or sandbox permissions, explain exactly what failed and what was still verified.

## Frontend architecture rules

### API/data-fetching

- Use generated OpenAPI types from `frontend/src/api/schema.d.ts`.
- Use `frontend/src/api/eiraClient.ts` for HTTP calls.
- Keep API module public shape stable unless intentionally refactoring views:

```ts
const { data } = await someApiCall(...)
```

- If a backend router/schema changes, regenerate:

```bash
cd backend
uv run python -c "import json; from app.main import app; print(json.dumps(app.openapi()))" > ../frontend/src/api/openapi.json
cd ../frontend
npx openapi-typescript src/api/openapi.json -o src/api/schema.d.ts
```

- Note: this project currently uses TypeScript 6; `openapi-typescript@7.x` may need `--legacy-peer-deps` during install because its peer dependency advertises TypeScript 5.

### UI/design system

Use the shared UI primitives when practical:

- `frontend/src/components/ui/PageHeader.vue`
- `frontend/src/components/ui/EiraCard.vue`
- `frontend/src/components/ui/EiraTable.vue`
- `frontend/src/components/ui/InlineError.vue`
- `frontend/src/components/ui/EmptyState.vue`
- `frontend/src/components/ui/FormField.vue`

Prefer these over duplicating `.header`, `.card`, `.data-table`, `.error`, `.hint`, and form label CSS.

Accessibility defaults:

- Use real `RouterLink`/`Button` controls; avoid clickable `<tr>`.
- Icon-only buttons need `aria-label`.
- Form controls need explicit labels and `id`/`inputId` where PrimeVue supports it.
- Wide tables need internal horizontal scroll, not page overflow.

### Feature module pattern

Large views should be composition roots. Put workflow/server state in feature modules:

- `features/session/useLoginFlow.ts`
- `features/session/useDeviceReparto.ts`
- `features/patient-chart/usePatientChart.ts`
- `features/cambi-turno/useCambiTurno.ts`
- `features/staff/useStaffWorkflow.ts`

When adding a new feature, prefer:

```txt
frontend/src/features/<feature>/use<Feature>.ts
frontend/src/features/<feature>/components/*.vue
```

Views should mostly wire route params, composables, and presentational components.


## Vue component/view architecture

- Route `views/*View.vue` are composition roots: route params, page layout, composables, and wiring.
- Do not put large workflow/API logic directly in views. Extract it to `features/<feature>/use<Feature>.ts`.
- Presentational components receive data via props and emit typed events with `defineEmits`; they should not mutate props.
- Use `computed` for filtered lists; do not combine `v-if` and `v-for` on the same element.
- Every `v-for` must have a stable `:key`.
- Use shared UI primitives before local CSS: `PageHeader`, `EiraCard`, `EiraTable`, `InlineError`, `EmptyState`, `FormField`.
- Use Pinia only for cross-route/global state such as auth/session. Keep dialog/form/loading state local or in feature composables.
- Route components should stay lazy-loaded with dynamic imports unless there is a specific reason not to.

## Backend rules

- Follow existing FastAPI router/service/model conventions.
- Preserve role/reparto scoping. Watch for IDOR bugs.
- Add or update tests for auth, permissions, and edge cases.
- Avoid test pollution of the real SQLite database; keep test DB isolation explicit.
- If adding models/entities, update schema/docs where relevant.

## Agent role matrix for Claude Code

If you use Claude Code subagents or separate sessions, apply these role scopes. If not spawning subagents, apply the matching role rules directly in the current session.

### `agent-code-writer`

Use for implementation/refactor work.

Rules:

- Own a narrow file/module scope.
- Make the smallest change that satisfies the task.
- Preserve public APIs unless the task asks to change them.
- Run relevant verification.

### `agent-design-system`

Use for frontend UI, PrimeVue, CSS tokens, accessibility, responsive layout.

Rules:

- Prefer existing UI primitives and tokens.
- Avoid one-off CSS duplication.
- Check keyboard/focus/labels/table overflow.

### `agent-tester`

Use for test strategy and verification.

Rules:

- Identify the smallest commands that prove the change.
- Prefer `npm run typecheck && npm run build` for frontend.
- Prefer targeted `uv run pytest ...` for backend.
- Report unverified risk explicitly.

### `agent-reviewer`

Use after implementation or before commit.

Rules:

- Review diffs only; do not rewrite unrelated code.
- Look for regressions, stale types, duplicated workflow, missing tests, broken permissions.
- Prioritize actionable findings.

### `agent-security-reviewer`

Use for auth, tokens, passwords, role/reparto access, sensitive data.

Rules:

- Check JWT/session handling, localStorage, password reset/temp password flows.
- Check backend scoping for ruolo/reparto/infermiere ownership.
- Treat frontend checks as UX only, not security.

### `agent-pr-writer`

Use at the end to summarize commits/PR.

Rules:

- Include changed areas, verification, residual risks, and follow-up tasks.
- Do not invent tests that were not run.

## Commit discipline

- Keep commits scoped.
- Do not mix unrelated backend and frontend changes.
- Before commit:

```bash
git status --short
git diff --stat
```

- Prefer messages like:
  - `refactor frontend architecture`
  - `extract frontend feature workflows`
  - `add patient chart API aggregate`
  - `fix auth rate limiting tests`

## Current frontend refactor status

Completed:

- Fase 1 — quick wins accessibilità/performance.
- Fase 2 — mini UI layer.
- Fase 3 — session/routing espliciti.
- Fase 4 — OpenAPI data-fetching module.
- Fase 5 — feature composables.
- Fase 6 — over-fetch reduction frontend-only.
- Fase 7 — token/responsive governance.

Remaining historical follow-ups from `docs/archive/FRONTEND-CODE-REFACTOR.md`:

- Manual viewport validation on real devices/browser, if needed.
- Backend/API aggregate endpoints for true over-fetch elimination, if the task explicitly spans backend.

## Recommended next frontend work

1. Backend/API follow-up for Fase 6 if the task explicitly spans backend:
   - add `GET /dashboard/infermiere`;
   - add patient-scoped SBAR endpoint, e.g. `GET /pazienti/{id}/consegne-sbar`;
   - add filtered list query parameters for users/patients/SBAR where needed.
