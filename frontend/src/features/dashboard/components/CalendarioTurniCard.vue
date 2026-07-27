<script setup lang="ts">
import Button from 'primevue/button'
import EiraCard from '@/components/ui/EiraCard.vue'
import EiraTable from '@/components/ui/EiraTable.vue'
import {
  TIPO_TURNO_LABEL,
  TIPI_TURNO_LAVORATIVI,
} from '@/features/turni/constants'
import type {
  CalendarioCella,
  CalendarioRiga,
} from '@/features/dashboard/types'
import { formatDateShortIt } from '@/utils/dateFormat'

defineProps<{
  rows: CalendarioRiga[]
  da: string
  a: string
  loading: boolean
  canGoPrevious: boolean
  canGoNext: boolean
}>()

const emit = defineEmits<{
  previousWeek: []
  nextWeek: []
}>()

const adesso = new Date()
const oggi = [
  adesso.getFullYear(),
  `${adesso.getMonth() + 1}`.padStart(2, '0'),
  `${adesso.getDate()}`.padStart(2, '0'),
].join('-')

function tooltipText(cella: CalendarioCella) {
  if (!cella.turno) return 'Nessun turno pianificato'

  const colleghi = cella.assegnati || 'nessun infermiere assegnato'
  const stato = cella.sottoCopertura ? 'Turno da coprire' : 'Turno coperto'

  return `Colleghi del turno: ${colleghi}. ${stato}.`
}
</script>

<template>
  <EiraCard flush class="dashboard-card">
    <div class="card-header">
      <h2>Calendario turni</h2>
      <div class="settimana-picker">
        <Button
          icon="pi pi-chevron-left"
          text
          aria-label="Settimana precedente"
          :disabled="!canGoPrevious"
          @click="emit('previousWeek')"
        />
        <span class="mono">
          {{ formatDateShortIt(da) }} – {{ formatDateShortIt(a) }}
        </span>
        <Button
          icon="pi pi-chevron-right"
          text
          aria-label="Settimana successiva"
          :disabled="!canGoNext"
          @click="emit('nextWeek')"
        />
      </div>
    </div>
    <EiraTable
      flush
      :loading="loading"
      :empty="rows.length === 0"
      empty-message="Nessun turno pianificato."
    >
      <table class="calendar-table">
        <thead>
          <tr>
            <th>Data</th>
            <th v-for="tipo in TIPI_TURNO_LAVORATIVI" :key="tipo">
              {{ TIPO_TURNO_LABEL[tipo] }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="riga in rows"
            :key="riga.data"
            :class="{ today: riga.data === oggi }"
          >
            <th class="row-label">{{ formatDateShortIt(riga.data) }}</th>
            <td v-for="cella in riga.celle" :key="cella.tipo">
              <span
                v-tooltip.top="cella.turno ? tooltipText(cella) : undefined"
                class="turno-cell"
                :class="{ interactive: cella.turno }"
                :tabindex="cella.turno ? 0 : undefined"
                :aria-label="tooltipText(cella)"
              >
                <template v-if="cella.turno">
                  <span
                    v-if="cella.turno.assegnazioni.length > 0"
                    class="assegnati"
                  >
                    {{ cella.assegnatiBreve }}
                  </span>
                  <span v-else class="scoperto">Scoperto</span>
                </template>
                <span v-else class="assente">—</span>
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
  align-items: flex-start;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}

.card-header h2 {
  margin: 0;
  font-size: 1.0625rem;
}

.settimana-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}

.settimana-picker :deep(.p-button) {
  min-width: var(--size-touch);
  min-height: var(--size-touch);
}

.settimana-picker > span {
  min-width: 0;
  text-align: center;
  font-size: 0.8125rem;
}

.today > :first-child {
  border-left: 3px solid var(--color-primary);
}

.calendar-table {
  min-width: 24rem;
  table-layout: fixed;
}

.calendar-table :is(th, td) {
  padding-inline: 4px;
}

.dashboard-card .calendar-table th {
  white-space: normal;
}

.calendar-table thead th {
  font-size: 12px;
  letter-spacing: 0;
}

.row-label {
  color: var(--steel);
  font-weight: 600;
}

.turno-cell {
  display: block;
  position: relative;
  width: 100%;
}

.turno-cell.interactive {
  cursor: help;
}

.turno-cell.interactive:focus-visible {
  border-radius: var(--radius-xs);
  outline: 2px solid var(--color-primary);
  outline-offset: 3px;
}

.scoperto {
  color: var(--state-urgente);
  font-weight: 600;
}

.assegnati {
  display: block;
}

.assente {
  color: var(--steel);
}

.mono {
  font-family: var(--mono);
}
</style>
