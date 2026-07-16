# Eira Docs Index

Questa cartella contiene la documentazione utile allo sviluppo e alla manutenzione della repo. I documenti storici o di ricerca restano disponibili in `archive/`, ma non sono fonti canoniche per nuove implementazioni.

## Start here

- [`FRONTEND-ARCHITECTURE.md`](./FRONTEND-ARCHITECTURE.md) — guida canonica per view, feature module, componenti e data flow frontend.
- [`BACKEND-ARCHITECTURE.md`](./BACKEND-ARCHITECTURE.md) — guida canonica per router, schema, service, model e policy backend.
- [`SETUP.md`](./SETUP.md) — setup locale, ambiente, database e comandi operativi.
- [`SECURITY.md`](./SECURITY.md) — modello di autenticazione, autorizzazione e rischi noti.

## Frontend, design e API

- [`DESIGN.md`](./DESIGN.md) — design system, token e linee guida visual.
- [`FETCHING.md`](./FETCHING.md) — convenzioni frontend per data fetching con OpenAPI.
- [`adr/0003-openapi-fetch-vs-axios.md`](./adr/0003-openapi-fetch-vs-axios.md) — decisione tecnica su `openapi-fetch` vs Axios.

## Dominio

- [`GLOSSARY.md`](./GLOSSARY.md) — glossario dei concetti clinici/prodotto usati nel codebase.
- [`domain/CAMBIO-TURNO-FLOW.md`](./domain/CAMBIO-TURNO-FLOW.md) — flusso cambio turno collega → caposala.
- [`domain/VALUTAZIONI-SCORING.md`](./domain/VALUTAZIONI-SCORING.md) — scoring Norton/Conley come implementato.

## Diagrammi

- [`diagrams/er-consegne-infermieristiche.drawio`](./diagrams/er-consegne-infermieristiche.drawio) — sorgente diagramma ER.
- [`diagrams/er-consegne-infermieristiche.drawio.png`](./diagrams/er-consegne-infermieristiche.drawio.png) — export PNG del diagramma ER.

## Archive

I documenti in [`archive/`](./archive/) sono mantenuti per contesto storico, ma non devono guidare nuovo sviluppo senza una verifica contro codice e docs canonici:

- `FRONTEND-CODE-REFACTOR.md`
- `FRONTEND-REFACTOR-SUMMARY.md`
- `AUTH-ARCHITECTURE-RESEARCH.md`
- `er-bozza.md`
