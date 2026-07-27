<script setup lang="ts">
import {
  computed,
  nextTick,
  ref,
  watch,
  type ComponentPublicInstance,
} from 'vue'
import Button from 'primevue/button'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import { useConfirm } from 'primevue/useconfirm'
import FormField from '@/components/ui/FormField.vue'
import InlineError from '@/components/ui/InlineError.vue'
import ConsegnaPreview from '@/features/patient-chart/components/ConsegnaPreview.vue'
import { dialogStyle } from '@/components/ui/dialogStyles'
import { prioritaOptions } from '@/features/patient-chart/form'
import {
  buildScaffold,
  findEmptySections,
  isPristineScaffold,
  parseConsegnaText,
  replaceSection,
  sectionsFor,
} from '@/features/patient-chart/consegnaSections'
import { useConsegnaTipoDrafts } from '@/features/patient-chart/useConsegnaTipoDrafts'
import {
  dateFromIsoDate,
  isoDateFromDate,
  turnoIdForDate,
  turnoLabelForDate,
} from '@/features/sbar/turnoOptions'
import type {
  GenericConsegnaDialogEmits,
  GenericConsegnaDialogProps,
  GenericConsegnaForm,
} from '@/features/patient-chart/types'

const visible = defineModel<boolean>('visible', { required: true })
const form = defineModel<GenericConsegnaForm>('form', { required: true })

const props = withDefaults(defineProps<GenericConsegnaDialogProps>(), {
  pazienti: () => [],
  hidePaziente: false,
  isEditing: false,
  copiedKeys: () => [],
  canCopyForward: false,
  copyForwardLoading: false,
})
const emit = defineEmits<GenericConsegnaDialogEmits>()

// In modifica paziente, tipo e turno sono gia' scritti nella riga salvata:
// cambiarli significherebbe spostare la consegna, non modificarla.
const showPaziente = computed(() => !props.hidePaziente && !props.isEditing)
const showTipo = computed(() => !props.isEditing)
const showTurno = computed(() => !props.isEditing)

const confirm = useConfirm()
const testoRef = ref<ComponentPublicInstance | null>(null)
// Le sezioni mancanti si marcano solo dopo un salvataggio fallito: segnalarle
// mentre l'utente scrive vorrebbe dire dargli torto a ogni carattere.
const submitAttempted = ref(false)
// L'errore appartiene al tentativo di salvataggio precedente: appena l'utente
// tocca il form la causa puo' essere gia' risolta (tipicamente lo e': il
// messaggio dice cosa sistemare), e lasciarlo rosso in fondo al dialog vuol
// dire accusare un form ormai corretto.
const errorStale = ref(false)

const tipoOptions = [
  { label: 'SBAR', value: 'sbar' },
  { label: 'CEDEMA', value: 'cedema' },
]

// Il cambio tipo e' libero e immediato: il testo dell'altro modello non viene
// convertito (le sezioni non hanno corrispondenza) ma resta da parte e torna se
// si torna indietro. In modifica il tipo resta nascosto.
const { cambiaTipo, resetBozze } = useConsegnaTipoDrafts(form)

const tipoModel = computed({
  get: () => form.value.tipo,
  set: cambiaTipo,
})

const pazienteOptions = computed(() =>
  props.pazienti.map((paziente) => ({
    id: paziente.id,
    // Il solo cognome non distingue due omonimi in reparto: letto ed eta'
    // sono due assi indipendenti di disambiguazione, e il filtro cerca
    // dentro questa stringa (quindi anche per numero di letto).
    label: `${paziente.cognome} ${paziente.nome} · letto ${paziente.letto} · ${paziente.eta} anni`,
  })),
)

const turnoRequired = computed(() => form.value.tipo === 'sbar')
const selectedDate = computed({
  get: () => dateFromIsoDate(form.value.data),
  set: (value: Date | null | undefined) => {
    form.value.data = isoDateFromDate(value)
  },
})
const selectedTurnoLabel = computed(() =>
  turnoLabelForDate(props.assegnazioni, form.value.data),
)

watch(
  () => [form.value.data, props.assegnazioni] as const,
  () => {
    // In modifica il turno arriva dalla consegna: ricalcolarlo da `data`
    // (nulla in edit) lo azzererebbe.
    if (!showTurno.value) return
    form.value.turno_id = turnoIdForDate(props.assegnazioni, form.value.data)
  },
  { immediate: true },
)

const sections = computed(() => sectionsFor(form.value.tipo))
const parsed = computed(() =>
  parseConsegnaText(form.value.testo, form.value.tipo),
)

// Lo scaffold del nuovo tipo entra solo su testo vuoto o scaffold non
// compilato: con del testo vero il cambio tipo non tocca nulla.
watch(
  () => form.value.tipo,
  (tipo) => {
    if (isPristineScaffold(form.value.testo))
      form.value.testo = buildScaffold(tipo)
  },
)

const copyForwardLabels = computed(() =>
  sections.value
    .filter((section) => section.copyForward)
    .map((section) => section.label)
    .join(' e '),
)

const missingKeys = computed(() =>
  submitAttempted.value
    ? findEmptySections(parsed.value.values, form.value.tipo).map(
        (section) => section.key,
      )
    : [],
)

// Reset a ogni apertura: una marcatura rossa ereditata dal tentativo
// precedente accuserebbe un form appena aperto.
// `errorStale` va riazzerato qui perche' il watch sul form lo alza anche sul
// precompilato di un'apertura in modifica.
watch(visible, (open) => {
  if (!open) return
  submitAttempted.value = false
  errorStale.value = false
  resetBozze()
})

watch(
  () => [form.value.paziente_id, form.value.tipo, form.value.testo] as const,
  () => {
    errorStale.value = true
  },
)
const visibleError = computed(() => (errorStale.value ? null : props.error))

function submit() {
  submitAttempted.value = true
  errorStale.value = false
  emit('save')
}

watch(
  () => props.error,
  async (message) => {
    if (!message) return
    await nextTick()
    // Il paziente mancante e' l'unico errore che non riguarda il testo:
    // mandare li' il fuoco a prescindere sposterebbe l'utente sul campo
    // sbagliato, e il Select resterebbe scrollato fuori dal dialog.
    const missingPaziente =
      showPaziente.value && form.value.paziente_id === null
    const field = missingPaziente
      ? document.getElementById('consegna-paziente')
      : (testoRef.value?.$el as HTMLTextAreaElement | undefined)
    field?.focus()
  },
)

function requestClose() {
  if (isPristineScaffold(form.value.testo)) {
    visible.value = false
    return
  }
  confirm.require({
    header: 'Consegna non salvata',
    message: 'Il testo scritto andrà perso. Chiudere lo stesso?',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Continua a scrivere',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: { label: 'Chiudi senza salvare', severity: 'danger' },
    accept: () => {
      visible.value = false
    },
  })
}

function quickFill(key: string) {
  form.value.testo = replaceSection(
    form.value.testo,
    form.value.tipo,
    key,
    'invariato',
  )
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :header="isEditing ? 'Modifica consegna' : 'Nuova consegna'"
    modal
    :style="dialogStyle.xl"
    :closable="false"
    :close-on-escape="false"
    :pt="{ root: { 'aria-labelledby': 'consegna-dialog-title' } }"
    @keydown.esc="requestClose"
  >
    <!-- Con lo slot #header custom PrimeVue non rende piu' il proprio titolo,
         ma l'`aria-labelledby` che genera continua a puntarlo: il dialog
         resta senza nome accessibile finche' non lo si ridirige qui. -->
    <template #header>
      <span id="consegna-dialog-title" class="p-dialog-title">{{
        isEditing ? 'Modifica consegna' : 'Nuova consegna'
      }}</span>
      <Button
        class="header-close"
        type="button"
        icon="pi pi-times"
        text
        rounded
        severity="secondary"
        aria-label="Chiudi"
        @click="requestClose"
      />
    </template>

    <form id="consegna-form" class="form" @submit.prevent="submit">
      <FormField
        v-if="showPaziente"
        for-id="consegna-paziente"
        label="Paziente"
        required
      >
        <Select
          v-model="form.paziente_id"
          input-id="consegna-paziente"
          :options="pazienteOptions"
          optionLabel="label"
          optionValue="id"
          placeholder="Seleziona paziente"
          filter
          filter-placeholder="Cerca per cognome o letto"
          empty-message="Nessun paziente visibile"
          empty-filter-message="Nessun paziente corrisponde"
          :aria-required="true"
        />
      </FormField>

      <FormField
        v-if="showTipo"
        for-id="consegna-tipo"
        label="Tipo consegna"
        required
      >
        <Select
          v-model="tipoModel"
          input-id="consegna-tipo"
          :options="tipoOptions"
          optionLabel="label"
          optionValue="value"
          :aria-required="true"
        />
      </FormField>

      <FormField
        v-if="showTurno"
        for-id="consegna-data"
        :label="turnoRequired ? 'Data turno' : 'Data turno (opzionale)'"
      >
        <DatePicker
          v-model="selectedDate"
          input-id="consegna-data"
          dateFormat="yy-mm-dd"
          placeholder="Seleziona data"
          :show-button-bar="!turnoRequired"
          :aria-required="turnoRequired"
        />
        <p v-if="selectedTurnoLabel" class="field-hint">
          Turno rilevato: {{ selectedTurnoLabel }}
        </p>
        <p v-else-if="form.data" class="field-hint field-hint--warning">
          Nessun turno assegnato in questa data.
        </p>
      </FormField>

      <!-- slot fisso: senza, togliendo Priorità la riga collassa e tutto
           il form sotto salta su -->
      <div class="field-slot">
        <FormField
          v-if="form.tipo === 'sbar'"
          for-id="consegna-priorita"
          label="Priorità"
        >
          <Select
            v-model="form.priorita"
            input-id="consegna-priorita"
            :options="prioritaOptions"
            optionLabel="label"
            optionValue="value"
          />
        </FormField>
      </div>

      <FormField
        class="span-2"
        for-id="consegna-testo"
        label="Testo consegna"
        required
      >
        <Textarea
          id="consegna-testo"
          ref="testoRef"
          v-model="form.testo"
          rows="8"
          autoResize
          :aria-required="true"
          :aria-invalid="missingKeys.length > 0"
          placeholder="Una sigla a inizio riga apre la sezione, il resto del testo la riempie."
        />
        <div v-if="canCopyForward" class="copy-forward">
          <Button
            type="button"
            severity="secondary"
            outlined
            size="small"
            label="Riprendi ultima consegna"
            :loading="copyForwardLoading"
            @click="emit('copyForward')"
          />
          <span class="field-hint">
            Riprende solo {{ copyForwardLabels }}: il resto cambia a ogni turno.
          </span>
        </div>
      </FormField>

      <ConsegnaPreview
        class="span-2"
        :sections="sections"
        :values="parsed.values"
        :has-orphan-text="parsed.hasOrphanText"
        :copied-keys="copiedKeys"
        :missing-keys="missingKeys"
        :can-copy-forward="canCopyForward"
        @quick-fill="quickFill"
        @copy-forward-section="emit('copyForwardSection', $event)"
      />
    </form>

    <!-- Azioni fuori dal corpo scrollabile: dentro il form finivano sotto
         l'anteprima, quindi il CTA primario e il messaggio d'errore
         restavano oltre il fondo del dialog gia' a 1920x828. `form=` le
         ricollega al form che ora non le contiene piu'. -->
    <template #footer>
      <div class="form-actions">
        <InlineError :message="visibleError" />
        <Button
          type="button"
          label="Annulla"
          severity="secondary"
          text
          @click="requestClose"
        />
        <Button
          type="submit"
          form="consegna-form"
          :label="isEditing ? 'Salva modifiche' : 'Salva consegna'"
          :loading="saving"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: var(--space-3) var(--space-4);
}

.span-2 {
  grid-column: 1 / -1;
}

/* PrimeVue rende sempre un `.p-dialog-header-actions` vuoto come ultimo
   figlio dell'header: con `space-between` la X custom finiva a meta' riga
   invece che a filo destro. */
.header-close {
  margin-left: auto;
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-3);
  width: 100%;
}

/* l'errore sta nella stessa riga delle azioni, ma spinto a sinistra: e' li'
   che guarda l'utente dopo aver premuto Salva */
.form-actions :deep(.inline-error) {
  margin: 0 auto 0 0;
}

/* cap all'autoResize: oltre questa soglia la textarea scrolla invece di
   allungare il dialog fino al max-height. `overflow-y` va riaffermato perche'
   autoResize di PrimeVue imposta `overflow: hidden` -> col cap il testo oltre
   la soglia risulterebbe tagliato e irraggiungibile. */
textarea {
  max-height: 40vh;
  overflow-y: auto;
}

.field-slot {
  min-width: 0;
}

.copy-forward {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  margin-top: 8px;
}

.copy-forward .field-hint {
  margin: 0;
}

/* --steel, non --muted: quest'ultimo sta a 2.56:1 su --surface e il "turno
   rilevato" e' informazione, non decorazione. Allineato a FormField. */
.field-hint {
  margin: 6px 0 0;
  color: var(--steel);
  font-size: 0.875rem;
}

.field-hint--warning {
  color: var(--state-urgente);
}

@media (max-width: 720px) {
  .form {
    grid-template-columns: 1fr;
  }
}
</style>
