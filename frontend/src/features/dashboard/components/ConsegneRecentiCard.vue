<script setup lang="ts">
import { RouterLink } from 'vue-router'
import StatusBadge from '@/components/StatusBadge.vue'
import EiraCard from '@/components/ui/EiraCard.vue'
import EiraTable from '@/components/ui/EiraTable.vue'
import type { ConsegneRecentiCardProps } from '@/features/dashboard/types'

defineProps<ConsegneRecentiCardProps>()
</script>

<template>
  <EiraCard class="dashboard-card">
    <div class="section-header">
      <h2>Consegne SBAR recenti</h2>
      <RouterLink :to="{ name: 'consegne-sbar' }" class="see-all">Vedi tutte</RouterLink>
    </div>
    <EiraTable v-if="!loading" :empty="consegne.length === 0" empty-message="Nessuna consegna registrata.">
      <table>
        <thead>
          <tr><th>Paziente</th><th>Priorità</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="consegna in consegne" :key="consegna.id">
            <td>
              <RouterLink :to="{ name: 'paziente-scheda', params: { id: consegna.paziente_id } }">
                {{ nomePaziente(consegna.paziente_id) }}
              </RouterLink>
            </td>
            <td><StatusBadge :status="consegna.priorita" /></td>
            <td class="mono">{{ new Date(consegna.creata_il).toLocaleDateString('it-IT') }}</td>
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

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.section-header h2 {
  margin: 0;
  font-size: 1.0625rem;
}

.see-all {
  color: var(--steel);
  font-size: 0.8125rem;
  font-weight: 600;
  text-decoration: none;
}

.dashboard-card :deep(td a) {
  color: inherit;
  font-weight: 600;
  text-decoration: none;
}
</style>
