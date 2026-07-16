<script setup lang="ts">
import { RouterLink } from 'vue-router'
import Button from 'primevue/button'
import EiraCard from '@/components/ui/EiraCard.vue'
import EiraTable from '@/components/ui/EiraTable.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import type { RichiestaCambioTurno } from '@/api/cambiTurno'

defineProps<{
  richieste: RichiestaCambioTurno[]
  loading: boolean
  nomeUtente: (utenteId: number) => string
}>()

const emit = defineEmits<{
  approve: [richiesta: RichiestaCambioTurno]
  reject: [richiesta: RichiestaCambioTurno]
}>()
</script>

<template>
  <EiraCard class="dashboard-card">
    <div class="section-header">
      <h2>Cambi turno in attesa</h2>
      <RouterLink :to="{ name: 'cambio-turno' }" class="see-all">Vedi tutti</RouterLink>
    </div>
    <EiraTable v-if="!loading" :empty="richieste.length === 0" empty-message="Nessun cambio turno in attesa.">
      <table>
        <thead>
          <tr><th>Richiedente</th><th>Collega</th><th>Stato</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="richiesta in richieste" :key="richiesta.id">
            <td>{{ nomeUtente(richiesta.richiedente_id) }}</td>
            <td>{{ nomeUtente(richiesta.collega_id) }}</td>
            <td><StatusBadge :status="richiesta.stato" /></td>
            <td class="actions">
              <template v-if="richiesta.stato === 'in_attesa_caposala'">
                <Button label="Approva" size="small" @click="emit('approve', richiesta)" />
                <Button label="Rifiuta" size="small" severity="secondary" @click="emit('reject', richiesta)" />
              </template>
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

.actions {
  display: flex;
  gap: 8px;
}
</style>
