<script setup lang="ts">
import { RouterLink } from 'vue-router'
import EiraCard from '@/components/ui/EiraCard.vue'
import EiraTable from '@/components/ui/EiraTable.vue'
import DashboardSectionHeader from '@/features/dashboard/components/DashboardSectionHeader.vue'
import type { PazientiAttiviCardProps } from '@/features/dashboard/types'

defineProps<PazientiAttiviCardProps>()
</script>

<template>
  <EiraCard flush class="dashboard-card">
    <DashboardSectionHeader
      title="Pazienti in reparto"
      route-name="pazienti"
      link-label="Vedi tutti"
    />
    <EiraTable
      flush
      :loading="loading"
      :empty="pazienti.length === 0"
      empty-message="Nessun paziente in reparto."
    >
      <table>
        <thead>
          <tr>
            <th>Paziente</th>
            <th>Letto</th>
            <th>Diagnosi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="paziente in pazienti" :key="paziente.id">
            <td>
              <RouterLink
                :to="{ name: 'paziente-scheda', params: { id: paziente.id } }"
              >
                {{ paziente.cognome }} {{ paziente.nome }}
              </RouterLink>
            </td>
            <td class="mono">{{ paziente.letto }}</td>
            <td>{{ paziente.diagnosi_ingresso }}</td>
          </tr>
        </tbody>
      </table>
    </EiraTable>
  </EiraCard>
</template>

<style scoped>
.dashboard-card :deep(td a) {
  color: inherit;
  font-weight: 600;
  text-decoration: none;
}
</style>
