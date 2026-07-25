<script setup lang="ts">
import { computed, watch } from 'vue'
import Button from 'primevue/button'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import FormField from '@/components/ui/FormField.vue'
import ConsegnaPreview from '@/features/patient-chart/components/ConsegnaPreview.vue'
import { dialogStyle } from '@/components/ui/dialogStyles'
import { prioritaOptions } from '@/features/patient-chart/form'
import {
  buildScaffold,
  isPristineScaffold,
  parseConsegnaText,
  sectionsFor,
  serializeToSigle,
} from '@/features/patient-chart/consegnaSections'
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

const tipoOptions = [
  { label: 'SBAR', value: 'sbar' },
  { label: 'CEDEMA', value: 'cedema' },
]

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

function quickFill(key: string) {
  form.value.testo = serializeToSigle(
    { ...parsed.value.values, [key]: 'invariato' },
    form.value.tipo,
  )
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :header="isEditing ? 'Modifica consegna' : 'Nuova consegna'"
    modal
    :style="dialogStyle.xl"
  >
    <form class="form" @submit.prevent="emit('save')">
      <FormField v-if="showPaziente" label="Paziente" required>
        <Select
          v-model="form.paziente_id"
          :options="pazienti"
          optionLabel="cognome"
          optionValue="id"
          placeholder="Seleziona paziente"
        />
      </FormField>

      <FormField v-if="showTipo" label="Tipo consegna" required>
        <Select
          v-model="form.tipo"
          :options="tipoOptions"
          optionLabel="label"
          optionValue="value"
        />
      </FormField>

      <FormField
        v-if="showTurno"
        :label="turnoRequired ? 'Data turno' : 'Data turno (opzionale)'"
      >
        <DatePicker
          v-model="selectedDate"
          dateFormat="yy-mm-dd"
          placeholder="Seleziona data"
          :show-button-bar="!turnoRequired"
        />
        <p v-if="selectedTurnoLabel" class="field-hint">
          Turno rilevato: {{ selectedTurnoLabel }}
        </p>
        <p v-else-if="form.data" class="field-hint field-hint--warning">
          Nessun turno assegnato in questa data.
        </p>
      </FormField>

      <FormField v-if="form.tipo === 'sbar'" label="Priorità">
        <Select
          v-model="form.priorita"
          :options="prioritaOptions"
          optionLabel="label"
          optionValue="value"
        />
      </FormField>

      <FormField class="span-2" label="Testo consegna" required>
        <Textarea
          v-model="form.testo"
          rows="8"
          autoResize
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
        :can-copy-forward="canCopyForward"
        @quick-fill="quickFill"
        @copy-forward-section="emit('copyForwardSection', $event)"
      />

      <div class="form-actions span-2">
        <Button
          type="submit"
          :label="isEditing ? 'Salva modifiche' : 'Salva consegna'"
          :loading="saving"
        />
      </div>
    </form>
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

.form-actions {
  display: flex;
  justify-content: flex-end;
}

/* cap all'autoResize: oltre questa soglia la textarea scrolla invece di
   allungare il dialog fino al max-height. `overflow-y` va riaffermato perche'
   autoResize di PrimeVue imposta `overflow: hidden` -> col cap il testo oltre
   la soglia risulterebbe tagliato e irraggiungibile. */
textarea {
  max-height: 40vh;
  overflow-y: auto;
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

.field-hint {
  margin: 6px 0 0;
  color: var(--muted);
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
