<script setup lang="ts">
import { computed, watch } from 'vue'
import Button from 'primevue/button'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import FormField from '@/components/ui/FormField.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { dialogStyle } from '@/components/ui/dialogStyles'
import { prioritaOptions } from '@/features/patient-chart/form'
import {
  dateFromIsoDate,
  isoDateFromDate,
  turnoIdForDate,
  turnoLabelForDate,
} from '@/features/sbar/turnoOptions'
import type {
  GenericConsegnaDialogProps,
  GenericConsegnaForm,
  PatientChartSaveEmit,
} from '@/features/patient-chart/types'

const visible = defineModel<boolean>('visible', { required: true })
const form = defineModel<GenericConsegnaForm>('form', { required: true })

const props = withDefaults(defineProps<GenericConsegnaDialogProps>(), {
  pazienti: () => [],
  hidePaziente: false,
})
const emit = defineEmits<PatientChartSaveEmit>()

const showPaziente = computed(() => !props.hidePaziente)

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
    form.value.turno_id = turnoIdForDate(props.assegnazioni, form.value.data)
  },
  { immediate: true },
)
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="Nuova consegna"
    modal
    :style="dialogStyle.lg"
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

      <FormField label="Tipo consegna" required>
        <Select
          v-model="form.tipo"
          :options="tipoOptions"
          optionLabel="label"
          optionValue="value"
        />
      </FormField>

      <FormField
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

      <FormField label="Testo consegna" required>
        <Textarea
          v-model="form.testo"
          rows="14"
          autoResize
          placeholder="Scrivi la consegna. Se vuoi, puoi usare etichette come Situation:, Background:, Assessment:, Recommendation: oppure Coscienza:, Dolore:, Mobilizzazione: ..."
        />
      </FormField>

      <section v-if="insight" class="insight" aria-live="polite">
        <h3>Suggerimento automatico</h3>
        <p>{{ insight.summary }}</p>
        <div v-if="insight.tags.length > 0" class="insight-tags">
          <StatusBadge
            v-for="tag in insight.tags"
            :key="tag"
            status="attivo"
            :label="tag"
          />
        </div>
      </section>

      <Button type="submit" label="Salva consegna" :loading="saving" />
    </form>
  </Dialog>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field-hint {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 0.875rem;
}

.field-hint--warning {
  color: var(--danger);
}

.insight {
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: color-mix(in srgb, var(--surface) 88%, var(--color-primary));
}

.insight h3 {
  margin: 0 0 8px;
  font-size: 0.95rem;
}

.insight p {
  margin: 0;
  color: var(--ink);
}

.insight-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
</style>
