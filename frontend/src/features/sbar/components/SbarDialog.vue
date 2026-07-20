<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import { dialogStyle } from '@/components/ui/dialogStyles'
import FormField from '@/components/ui/FormField.vue'
import { prioritaOptions, validateSbarForm } from '@/features/sbar/form'
import {
  dateFromIsoDate,
  isoDateFromDate,
  turnoIdForDate,
  turnoLabelForDate,
  type AssegnazioneTurnoOption,
} from '@/features/sbar/turnoOptions'
import type {
  ConsegnaSbarForm,
  Paziente,
  SbarFormErrors,
} from '@/features/sbar/types'

const visible = defineModel<boolean>('visible', { required: true })
const form = defineModel<ConsegnaSbarForm>('form', { required: true })

const props = withDefaults(
  defineProps<{
    isEditing: boolean
    saving: boolean
    assegnazioni: AssegnazioneTurnoOption[]
    pazienti?: Paziente[]
    hidePaziente?: boolean
  }>(),
  {
    pazienti: () => [],
    hidePaziente: false,
  },
)

const emit = defineEmits<{
  save: []
}>()

const errors = ref<SbarFormErrors>({})
const showPaziente = computed(() => !props.isEditing && !props.hidePaziente)
const showTurno = computed(() => !props.isEditing)
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
    if (!showTurno.value) return
    form.value.turno_id = turnoIdForDate(props.assegnazioni, form.value.data)
  },
  { immediate: true },
)

watch(visible, (isVisible) => {
  if (!isVisible) errors.value = {}
})

function submit() {
  errors.value = validateSbarForm(form.value, {
    checkPazienteTurno: !props.isEditing,
  })
  if (Object.keys(errors.value).length > 0) return

  emit('save')
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :header="isEditing ? 'Modifica consegna' : 'Nuova consegna'"
    modal
    :style="dialogStyle.lg"
  >
    <form class="form" novalidate @submit.prevent="submit">
      <FormField
        v-if="showPaziente"
        label="Paziente"
        required
        :error="errors.paziente_id"
      >
        <Select
          v-model="form.paziente_id"
          :options="pazienti"
          optionLabel="cognome"
          optionValue="id"
          placeholder="Seleziona paziente"
        />
      </FormField>
      <FormField
        v-if="showTurno"
        label="Data turno"
        forId="consegna-data-turno"
        required
        :error="errors.data"
      >
        <DatePicker
          v-model="selectedDate"
          inputId="consegna-data-turno"
          dateFormat="yy-mm-dd"
          placeholder="Seleziona data"
          required
        />
        <p v-if="selectedTurnoLabel" class="field-hint">
          Turno rilevato: {{ selectedTurnoLabel }}
        </p>
        <p v-else-if="form.data" class="field-hint field-hint--warning">
          Nessun turno assegnato in questa data.
        </p>
      </FormField>
      <FormField label="Priorità">
        <Select
          v-model="form.priorita"
          :options="prioritaOptions"
          optionLabel="label"
          optionValue="value"
        />
      </FormField>
      <FormField label="Situation" required :error="errors.situation">
        <Textarea v-model="form.situation" rows="2" />
      </FormField>
      <FormField label="Background" required :error="errors.background">
        <Textarea v-model="form.background" rows="2" />
      </FormField>
      <FormField label="Assessment" required :error="errors.assessment">
        <Textarea v-model="form.assessment" rows="2" />
      </FormField>
      <FormField label="Recommendation" required :error="errors.recommendation">
        <Textarea v-model="form.recommendation" rows="2" />
      </FormField>
      <Button type="submit" label="Salva" :loading="saving" />
    </form>
  </Dialog>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-hint {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 0.875rem;
}

.field-hint--warning {
  color: var(--danger);
}
</style>
