# Frontend Architecture

Questo è il documento canonico da seguire quando si spostano, ridisegnano o aggiungono schermate frontend.

Per il contesto storico del refactor vedere anche:

- `docs/FRONTEND-REFACTOR-SUMMARY.md`

## Principio guida

> **Le view sono composition roots leggere; i feature module possiedono workflow, componenti, types e form mapping.**

Le schermate sotto `frontend/src/views` non devono diventare contenitori di business logic. Devono comporre feature già modellate sotto `frontend/src/features`.

## Layer frontend

```txt
frontend/src/
  api/                  # wrapper typed sugli endpoint backend/OpenAPI
  components/ui/        # primitive UI condivise
  components/           # componenti shared non feature-specific
  features/             # moduli funzionali profondi
  router/               # route, role guard, nav metadata
  stores/               # Pinia/session state globale
  utils/                # helper puri condivisi
  views/                # route-level composition roots
```

## Regole per `views/`

Una view può:

- leggere route params;
- invocare uno o più composable feature-level;
- chiamare `onMounted(load)`;
- comporre componenti presentational;
- mostrare `PageHeader`, `InlineError`, layout di pagina.

Una view non deve contenere:

- payload API costruiti inline;
- tabelle grandi con azioni business;
- dialog/form complessi;
- form factory;
- mapping `Date -> YYYY-MM-DD`;
- types inline riutilizzabili;
- regole di permesso duplicate;
- chiamate API dirette, salvo view veramente banali e temporanee.

## Regole per `features/<feature>/`

Struttura raccomandata:

```txt
features/<feature>/
  components/           # componenti presentational della feature
  use<Feature>.ts       # workflow/server state/mutations
  types.ts              # props, emits, view model, form types
  form.ts               # form factory e payload mapping, se necessario
```

Per feature complesse, dividere il composable:

```txt
useFeature.ts           # facade pubblica stabile per la view
useFeatureQueries.ts    # query/server state
useFeatureDialogs.ts    # dialog/form/mutations
useFeatureSomething.ts  # sotto-area autonoma
```

Esempio attuale da seguire:

```txt
features/patient-chart/
  usePatientChart.ts
  usePatientChartQueries.ts
  usePatientChartDialogs.ts
  usePatientChartSbar.ts
  types.ts
  form.ts
  components/
```

## Componenti presentational

I componenti in `features/*/components` devono:

- ricevere dati da props;
- emettere azioni via events;
- non chiamare API direttamente;
- non importare store salvo casi eccezionali;
- non decidere il workflow;
- usare `types.ts` quando props/emits non sono banali.

Pattern:

```ts
defineProps<FeatureTableProps>()
const emit = defineEmits<FeatureTableEmits>()
```

## Form e payload mapping

Ogni form non banale deve avere factory e mapping in `form.ts`:

```ts
export function createEmptyFeatureForm(): FeatureForm
export function toFeaturePayload(form: FeatureForm): FeaturePayload | null
```

Già applicato in:

```txt
features/patients/form.ts
features/cambi-turno/form.ts
features/patient-chart/form.ts
features/sbar/form.ts
```

## API layer

I file sotto `frontend/src/api` sono wrapper typed sul backend.

Regole:

- mantenere shape `{ data }` per compatibilità interna;
- non fare mapping UI nei wrapper API;
- non usare direttamente `eiraClient` dalle view;
- se un endpoint richiede normalizzazione response, farla nel wrapper API;
- valutare helper condiviso solo se riduce duplicazione senza nascondere errori.

## UI primitives

Prima di creare componenti custom, riusare:

```txt
components/ui/EiraCard.vue
components/ui/EiraTable.vue
components/ui/PageHeader.vue
components/ui/InlineError.vue
components/ui/EmptyState.vue
components/ui/FormField.vue
```

Regole:

- usare CSS variables esistenti;
- evitare colori/spazi hardcoded;
- evitare styling duplicato nelle view;
- per card dashboard con link usare `features/dashboard/components/DashboardSectionHeader.vue`.

## Router e navigazione

`frontend/src/router/index.ts` centralizza:

- route names;
- role guard;
- nav metadata;
- landing route per ruolo.

Policy attuale:

- `Banca Ore` è sezione dashboard per infermiere;
- `/banca-ore` resta pagina/nav solo per caposala;
- route condivise usano `roles: ALL_ROLES`;
- route role-specific usano `roles: ['infermiere']` o `roles: ['caposala']`.

## Dashboard policy

- Dashboard caposala: `features/dashboard/useCaposalaDashboard.ts`.
- Dashboard infermiere: `features/dashboard/useInfermiereDashboard.ts`.
- Card/sections sono componenti presentational.
- Banca ore è `features/banca-ore/BancaOreSection` riusata sia in dashboard infermiere sia nella pagina caposala.

## Checklist prima di completare una modifica frontend

- [ ] La view è rimasta una composition root?
- [ ] La logica API/workflow è in un composable?
- [ ] I form hanno factory/mapping in `form.ts`?
- [ ] Props/emits riutilizzabili sono in `types.ts`?
- [ ] I componenti presentational non chiamano API?
- [ ] Sono stati riusati componenti `components/ui`?
- [ ] Date/turni usano helper/constants condivisi?
- [ ] La nav/role policy è coerente nel router?
- [ ] Eseguito `cd frontend && npm run typecheck`?
- [ ] Eseguito `cd frontend && npm run build` se cambia UI o bundling?

## Cosa evitare

- Nuove view monolitiche.
- Tipi duplicati dentro `.vue` quando servono a più componenti.
- Payload API costruiti in template/view.
- Componenti feature che importano store globale per comodità.
- Copiare CSS dashboard/card invece di estrarre un componente se il pattern si ripete.
