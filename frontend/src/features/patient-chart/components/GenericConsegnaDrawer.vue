<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import Drawer from 'primevue/drawer'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import FormField from '@/components/ui/FormField.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { prioritaOptions } from '@/features/patient-chart/form'
import type {
  GenericConsegnaDrawerProps,
  GenericConsegnaForm,
  PatientChartSaveEmit,
} from '@/features/patient-chart/types'

const visible = defineModel<boolean>('visible', { required: true })
const form = defineModel<GenericConsegnaForm>('form', { required: true })

defineProps<GenericConsegnaDrawerProps>()
const emit = defineEmits<PatientChartSaveEmit>()

const tipoOptions = [
  { label: 'SBAR', value: 'sbar' },
  { label: 'CEDEMA', value: 'cedema' },
]

const turnoRequired = computed(() => form.value.tipo === 'sbar')
</script>

<template>
  <Drawer
    v-model:visible="visible"
    header="Nuova consegna"
    position="right"
    class="drawer"
  >
    <form class="form" @submit.prevent="emit('save')">
      <FormField label="Tipo consegna" required>
        <Select
          v-model="form.tipo"
          :options="tipoOptions"
          optionLabel="label"
          optionValue="value"
        />
      </FormField>

      <FormField label="Data">
        <InputText :model-value="form.data" readonly />
      </FormField>

      <FormField :label="turnoRequired ? 'Turno' : 'Turno (opzionale)'">
        <Select
          v-model="form.turno_id"
          :options="assegnazioni"
          optionLabel="turno_id"
          optionValue="turno_id"
          :show-clear="!turnoRequired"
          placeholder="Seleziona turno"
        />
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
  </Drawer>
</template>

<style scoped>
.drawer {
  width: min(42rem, 100vw);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
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
