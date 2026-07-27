<script setup lang="ts">
import EiraCard from '@/components/ui/EiraCard.vue'
import EiraTable from '@/components/ui/EiraTable.vue'
import { formatCambioRichiesto } from '@/features/cambi-turno/format'
import DashboardSectionHeader from '@/features/dashboard/components/DashboardSectionHeader.vue'
import type { RichiesteCambioTurnoCardProps } from '@/features/dashboard/types'

defineProps<RichiesteCambioTurnoCardProps>()
</script>

<template>
  <EiraCard flush class="dashboard-card">
    <DashboardSectionHeader
      title="In attesa di approvazione"
      route-name="cambio-turno"
      link-label="Vedi tutte"
    />

    <EiraTable
      flush
      :loading="loading"
      :empty="richieste.length === 0"
      empty-message="Nessuna richiesta in attesa di approvazione."
    >
      <table class="compact-table">
        <thead>
          <tr>
            <th>Da chi</th>
            <th>Cambio</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="richiesta in richieste" :key="richiesta.id">
            <td>{{ nomeUtente(richiesta.richiedente_id) }}</td>
            <td class="cambio">{{ formatCambioRichiesto(richiesta) }}</td>
          </tr>
        </tbody>
      </table>
    </EiraTable>
  </EiraCard>
</template>

<style scoped>
.compact-table {
  table-layout: fixed;
}

.compact-table :is(th, td):first-child {
  width: 8rem;
  overflow-wrap: anywhere;
}

.cambio {
  font-weight: 600;
  overflow-wrap: anywhere;
}
</style>
