# CLAUDE.md — Eira Frontend

When working inside `frontend/`, read the repository-level guide first:

- `../CLAUDE.md`

Frontend-specific reminders:

- Stack: Vue 3 + Vite + TypeScript + Pinia + PrimeVue.
- Do not reintroduce axios; use `src/api/eiraClient.ts` and generated OpenAPI types.
- Prefer shared UI primitives in `src/components/ui` before local CSS.
- Keep large views as composition roots; workflow logic belongs in `src/features/*` composables.
- Verification before claiming frontend work complete:

```bash
npm run typecheck
npm run build
```
