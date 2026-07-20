<script setup lang="ts">
import { RouterLink } from 'vue-router'
import StatusBadge from '@/components/StatusBadge.vue'
import EiraCard from '@/components/ui/EiraCard.vue'
import EiraTable from '@/components/ui/EiraTable.vue'
import DashboardSectionHeader from '@/features/dashboard/components/DashboardSectionHeader.vue'
import type { ConsegneRecentiCardProps } from '@/features/dashboard/types'

defineProps<ConsegneRecentiCardProps>()
</script>

<template>
  <EiraCard class="dashboard-card">
    <DashboardSectionHeader
      title="Diario Clinico recenti"
      route-name="consegne-sbar"
      link-label="Vedi tutte"
    />
    <EiraTable
      :loading="loading"
      :empty="consegne.length === 0"
      empty-message="Nessuna consegna registrata."
    >
      <table>
        <thead>
          <tr>
            <th>Paziente</th>
            <th>Priorità</th>
            <th><span class="sr-only">Azioni</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="consegna in consegne" :key="consegna.id">
            <td>
              <RouterLink
                :to="{
                  name: 'paziente-scheda',
                  params: { id: consegna.paziente_id },
                }"
              >
                {{ nomePaziente(consegna.paziente_id) }}
              </RouterLink>
            </td>
            <td><StatusBadge :status="consegna.priorita" /></td>
            <td class="mono">
              {{ new Date(consegna.creata_il).toLocaleDateString('it-IT') }}
            </td>
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
