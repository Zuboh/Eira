# Eira frontend

Vue 3 + Vite + TypeScript + Pinia + PrimeVue. Le view sono composition
root leggere; workflow e server state vivono nei moduli `src/features`.
Le chiamate HTTP passano da `src/api/eiraClient.ts` e dai tipi generati
da OpenAPI.

Usare Node dalla `.nvmrc` nella root del repository.

```bash
npm ci
npm run dev
```

Verifica completa frontend:

```bash
npm run lint
npm run format:check
npm run test
npm run typecheck
npm run build
npm run openapi:check
npm run test:e2e
```

Le regole architetturali canoniche sono in
`../docs/FRONTEND-ARCHITECTURE.md` e `../CLAUDE.md`.
