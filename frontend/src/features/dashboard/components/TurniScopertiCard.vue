<script setup lang="ts">
import Button from 'primevue/button'
import EiraCard from '@/components/ui/EiraCard.vue'
import EiraTable from '@/components/ui/EiraTable.vue'
import type { DashboardCaposala } from '@/api/dashboard'
import type { Turno } from '@/api/turni'
import { TIPO_TURNO_LABEL } from '@/features/turni/constants'
import { formatDateShortIt } from '@/utils/dateFormat'

defineProps<{
  turni: DashboardCaposala['turni_scoperti']
  total: number
  giorni: number
  loading: boolean
}>()

const emit = defineEmits<{
  assign: [turno: Turno]
  rangeChange: [giorni: number]
}>()

const RANGE_OPTIONS = [7, 14, 30] as const
</script>

<template>
  <EiraCard flush class="dashboard-card">
    <div class="card-header">
      <div>
        <h2>Turni da coprire</h2>
        <p v-if="total > turni.length">{{ turni.length }} di {{ total }}</p>
      </div>
      <div class="range-filter" aria-label="Intervallo turni da coprire">
        <button
          v-for="option in RANGE_OPTIONS"
          :key="option"
          type="button"
          :aria-pressed="giorni === option"
          @click="emit('rangeChange', option)"
        >
          {{ option }} gg
        </button>
      </div>
    </div>
    <EiraTable
      flush
      max-height="28rem"
      :loading="loading"
      :empty="turni.length === 0"
      :empty-message="`Nessun turno scoperto nei prossimi ${giorni} giorni.`"
    >
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Turno</th>
            <th>Orario</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="turno in turni" :key="turno.id">
            <td>{{ formatDateShortIt(turno.data) }}</td>
            <td>{{ TIPO_TURNO_LABEL[turno.tipo] }}</td>
            <td class="mono">
              {{ turno.ora_inizio.slice(0, 5) }}–{{
                turno.ora_fine.slice(0, 5)
              }}
            </td>
            <td>
              <span class="actions">
                <Button
                  label="Assegna"
                  size="small"
                  @click="emit('assign', turno)"
                />
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </EiraTable>
  </EiraCard>
</template>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.card-header h2 {
  margin: 0;
  font-size: 1.0625rem;
}

.card-header p {
  margin: 3px 0 0;
  color: var(--steel);
  font-size: 0.8125rem;
}

.range-filter {
  display: inline-flex;
  padding: 2px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.range-filter button {
  min-height: var(--size-touch);
  padding: 0 12px;
  border: 0;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--steel);
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
}

.range-filter button[aria-pressed='true'] {
  background: color-mix(in srgb, var(--color-primary) 14%, var(--surface));
  color: var(--color-primary-on-tint);
}

.range-filter button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 560px) {
  .card-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
