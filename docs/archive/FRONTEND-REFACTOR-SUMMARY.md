# Frontend Refactor Summary

Questo documento riassume lo stato architetturale del frontend dopo il refactor a moduli feature-oriented. Serve come guida rapida per continuare lo sviluppo con Codex, Claude Code o altri agenti senza tornare a view monolitiche.

## Obiettivo architetturale

Il frontend deve seguire questa regola:

> **Le view sono composition roots leggere; i feature module contengono workflow, form mapping, types e componenti presentational.**

Una view dovrebbe principalmente:

- leggere parametri route o stato minimo locale;
- chiamare uno o più composable feature-level;
- comporre componenti presentational tramite props/events;
- gestire lifecycle semplice, per esempio `onMounted(load)`.

Una view non dovrebbe contenere:

- payload API costruiti inline;
- grosse tabelle HTML con azioni business;
- dialog/form complessi;
- tipi inline riutilizzabili;
- form factory o mapping `Date -> API string`;
- logica di permessi duplicata.

## Struttura feature attuale

```txt
frontend/src/features/
  banca-ore/
    components/BancaOreSection.vue
    types.ts
    useBancaOre.ts
  cambi-turno/
    components/CambiTurnoTable.vue
    components/NewCambioTurnoDialog.vue
    components/RifiutoCambioTurnoDialog.vue
    form.ts
    types.ts
    useCambiTurno.ts
  dashboard/
    components/*Card.vue
    components/DashboardSectionHeader.vue
    calendarViewModel.ts
    types.ts
    useCaposalaDashboard.ts
    useInfermiereDashboard.ts
  patient-chart/
    components/*Tab.vue
    components/*Dialog.vue
    form.ts
    types.ts
    usePatientChart*.ts
  patients/
    components/NewPatientDialog.vue
    components/PatientsTable.vue
    form.ts
    types.ts
    usePatients.ts
  sbar/
    form.ts
    types.ts
    useConsegneSbar.ts
  session/
    components/*Step.vue
    useLoginFlow.ts
  staff/
    components/StaffFilters.vue
    components/StaffTable.vue
    types.ts
    useStaffWorkflow.ts
  turni/
    constants.ts
```

## Pattern obbligatori per nuovi sviluppi

### 1. View = wiring

Quando una view cresce oltre wiring semplice, estrarre subito:

```txt
features/<feature>/use<Feature>.ts
features/<feature>/types.ts
features/<feature>/form.ts       # se ci sono form/payload mapping
features/<feature>/components/*  # tabelle, card, dialog, sezioni
```

Esempio desiderato:

```vue
<script setup lang="ts">
const { items, loading, error, load, save } = useFeature()
onMounted(load)
</script>

<template>
  <PageHeader title="..." />
  <InlineError :message="error" />
  <FeatureTable :items="items" :loading="loading" @save="save" />
</template>
```

### 2. Componenti presentational = props/events

I componenti sotto `features/*/components` dovrebbero:

- ricevere dati via props;
- emettere azioni via events;
- non chiamare API direttamente;
- non importare store salvo casi motivati;
- usare tipi da `features/<feature>/types.ts`.

Esempio:

```ts
defineProps<FeatureTableProps>()
const emit = defineEmits<FeatureTableEmits>()
```

### 3. Form mapping fuori dalle view

Qualsiasi conversione da form UI a payload API deve stare in `form.ts`.

Esempi già presenti:

- `features/patients/form.ts`
- `features/cambi-turno/form.ts`
- `features/patient-chart/form.ts`
- `features/sbar/form.ts`

### 4. Composable = workflow e server state

I composable feature-level gestiscono:

- `loading` / `error`;
- load e refresh dati;
- mutation API;
- reset form/dialog;
- computed di permessi o view-model.

Se un composable supera troppe responsabilità, dividerlo in sotto-composable, come fatto in `patient-chart`:

```txt
usePatientChart.ts          # facade pubblica
usePatientChartQueries.ts   # query/server-state
usePatientChartDialogs.ts   # dialog/form/mutations
usePatientChartSbar.ts      # lazy SBAR
```

### 5. Shared helpers invece di inline formatting

Non duplicare formattazioni inline tipo:

```ts
slice(0, 16).replace('T', ' ')
new Date(...).toLocaleDateString(...)
```

Usare helper condivisi:

```txt
frontend/src/utils/dateFormat.ts
frontend/src/features/turni/constants.ts
```

## Scelte UX/architettura già prese

### Banca Ore

- Per **infermiere**, la banca ore è una sezione nella dashboard con cambio mese inline.
- Per **caposala**, resta una pagina dedicata `/banca-ore`, perché serve selezionare l'infermiere.
- La nav `Banca Ore` è riservata alla caposala; l'infermiere la consulta dalla dashboard.

### Dashboard

- Dashboard caposala e infermiere hanno composable separati:
  - `useCaposalaDashboard`
  - `useInfermiereDashboard`
- Le card dashboard sono componenti presentational.
- Header card con link “Vedi tutti” usa `DashboardSectionHeader.vue`.

### Patient chart

La scheda paziente è il modulo più profondo e va usata come modello per refactor futuri:

- view leggera;
- facade composable;
- sotto-composable per query/mutation/lazy state;
- types/form/dialog/tab component separati.

## Checklist per agenti prima di modificare frontend

Prima di aggiungere codice:

- [ ] Ho controllato se esiste già un feature module adatto?
- [ ] Sto modificando una view solo come composition root?
- [ ] Props/emits sono tipizzati in `types.ts` se riutilizzabili?
- [ ] Mapping form/API sta in `form.ts`?
- [ ] La logica API sta in un composable, non in un componente presentational?
- [ ] Sto riusando `EiraCard`, `EiraTable`, `PageHeader`, `InlineError`, `FormField`?
- [ ] Ho evitato duplicazioni di formatting date/turni?
- [ ] Ho verificato con `npm run typecheck` e, se tocco UI/build, `npm run build`?

## Stato refactor completato

Fasi completate nel piano `TASK.md`:

- DM-1 / DM-2: Dashboard caposala deep module e cards.
- DM-3: SBAR feature module.
- DM-4: formatting/constants condivisi.
- DM-6: Login split in step components.
- DM-7 / DM-8 / DM-9: Patient chart dialogs, composable split, component contracts.
- DM-10: Patients feature module.
- DM-11: Cambio turno presentational split.
- DM-12: Staff view presentational split.
- DM-13: Banca ore come dashboard section infermiere.
- DM-14: Dashboard infermiere feature split.
- DM-15: Dashboard consolidation.

## Miglioramenti rimasti consigliati

1. **API client cleanup**
   - Alcuni wrapper API hanno helper `unwrapData` duplicati.
   - Possibile estrarre un helper condiviso se non aumenta coupling.

2. **Dashboard card style consolidation ulteriore**
   - `dashboard-card { margin-top: 24px }` è ancora ripetuto in più card.
   - Valutare un wrapper shared solo se la duplicazione cresce.

3. **Test frontend**
   - Attualmente la verifica principale è `vue-tsc` + build.
   - Se il progetto introduce Vitest, partire da form mapping e composable puri.

4. **Route/nav policy documentata in router**
   - La policy ruoli è già centralizzata nel router.
   - Se crescono le route, valutare `routes.ts` separato o helper per nav.

5. **Design system tokens**
   - Continuare a preferire componenti UI esistenti e variabili CSS.
   - Evitare componenti one-off con colori/spazi hardcoded.
