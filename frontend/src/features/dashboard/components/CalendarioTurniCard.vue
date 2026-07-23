<script setup lang="ts">
import EiraCard from '@/components/ui/EiraCard.vue'
import EiraTable from '@/components/ui/EiraTable.vue'
import { TIPO_TURNO_LABEL, TIPI_TURNO } from '@/features/turni/constants'
import type {
  CalendarioCella,
  CalendarioRiga,
} from '@/features/dashboard/types'
import { formatDateShortIt } from '@/utils/dateFormat'

defineProps<{
  rows: CalendarioRiga[]
  loading: boolean
}>()

function tooltipText(cella: CalendarioCella) {
  if (!cella.turno) return 'Nessun turno pianificato'

  const colleghi = cella.assegnati || 'nessun infermiere assegnato'
  const copertura = cella.sottoCopertura
    ? `Copertura ${cella.assegnatiCount}/2`
    : 'Copertura completa'

  return `Colleghi del turno: ${colleghi}. ${copertura}.`
}
</script>

<template>
  <EiraCard flush title="Calendario turni" class="dashboard-card">
    <EiraTable
      flush
      :loading="loading"
      :empty="rows.length === 0"
      empty-message="Nessun turno pianificato."
    >
      <table style="min-width: 30rem">
        <thead>
          <tr>
            <th><span class="sr-only">Data</span></th>
            <th v-for="tipo in TIPI_TURNO" :key="tipo">
              {{ TIPO_TURNO_LABEL[tipo] }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="riga in rows" :key="riga.data">
            <th class="row-label">{{ formatDateShortIt(riga.data) }}</th>
            <td v-for="cella in riga.celle" :key="cella.tipo">
              <span
                class="turno-cell"
                :class="{ interactive: cella.turno }"
                :tabindex="cella.turno ? 0 : undefined"
                :aria-label="tooltipText(cella)"
                :title="tooltipText(cella)"
              >
                <template v-if="cella.turno">
                  <span
                    v-if="cella.turno.assegnazioni.length > 0"
                    class="assegnati"
                  >
                    {{ cella.assegnati }}
                  </span>
                  <span v-else class="scoperto">Scoperto</span>
                  <span v-if="cella.sottoCopertura" class="copertura">
                    Copertura {{ cella.assegnatiCount }}/2
                  </span>
                  <span class="tooltip" role="tooltip">
                    {{ tooltipText(cella) }}
                  </span>
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
.dashboard-card {
  margin-top: 24px;
}

.row-label {
  color: var(--steel);
  font-weight: 600;
}

.turno-cell {
  display: inline-block;
  position: relative;
}

.turno-cell.interactive {
  cursor: help;
}

.turno-cell.interactive:focus-visible {
  border-radius: var(--radius-xs);
  outline: 2px solid var(--color-primary);
  outline-offset: 3px;
}

.tooltip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  z-index: 20;
  width: max-content;
  max-width: 18rem;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--ink);
  box-shadow: var(--shadow-md);
  color: white;
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1.35;
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, 4px);
  transition:
    opacity 0.12s ease,
    transform 0.12s ease;
  white-space: normal;
}

.tooltip::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 100%;
  border: 6px solid transparent;
  border-top-color: var(--ink);
  transform: translateX(-50%);
}

.turno-cell.interactive:hover .tooltip,
.turno-cell.interactive:focus-visible .tooltip {
  opacity: 1;
  transform: translate(-50%, 0);
}

.scoperto {
  color: var(--state-urgente);
  font-weight: 600;
}

.assegnati,
.copertura {
  display: block;
}

.copertura {
  color: var(--state-urgente);
  font-size: 0.8125rem;
  font-weight: 600;
  margin-top: 2px;
}

.assente {
  color: var(--steel);
}
</style>
