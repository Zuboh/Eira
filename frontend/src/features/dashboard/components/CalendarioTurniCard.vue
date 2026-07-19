<script setup lang="ts">
import EiraCard from '@/components/ui/EiraCard.vue'
import EiraTable from '@/components/ui/EiraTable.vue'
import { TIPO_TURNO_LABEL, TIPI_TURNO } from '@/features/turni/constants'
import type { CalendarioRiga } from '@/features/dashboard/types'
import { formatDateShortIt } from '@/utils/dateFormat'

defineProps<{
  rows: CalendarioRiga[]
  loading: boolean
}>()
</script>

<template>
  <EiraCard title="Calendario turni" class="dashboard-card">
    <EiraTable
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
              <template v-if="cella.turno">
                <span
                  v-if="cella.turno.assegnazioni.length > 0"
                  class="assegnati"
                >
                  {{ cella.assegnati }}
                </span>
                <span v-else class="scoperto">Scoperto</span>
              </template>
              <span v-else class="assente">—</span>
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

.scoperto {
  color: var(--state-urgente);
  font-weight: 600;
}

.assente {
  color: var(--steel);
}
</style>
