<script setup lang="ts">
import Button from 'primevue/button'
import EiraCard from '@/components/ui/EiraCard.vue'
import EiraTable from '@/components/ui/EiraTable.vue'
import DashboardSectionHeader from '@/features/dashboard/components/DashboardSectionHeader.vue'
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
    <DashboardSectionHeader
      title="Cambi turno in attesa"
      route-name="cambio-turno"
      link-label="Vedi tutti"
    />
    <EiraTable
      v-if="!loading"
      :empty="richieste.length === 0"
      empty-message="Nessun cambio turno in attesa."
    >
      <table>
        <thead>
          <tr>
            <th>Richiedente</th>
            <th>Collega</th>
            <th>Stato</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="richiesta in richieste" :key="richiesta.id">
            <td>{{ nomeUtente(richiesta.richiedente_id) }}</td>
            <td>{{ nomeUtente(richiesta.collega_id) }}</td>
            <td><StatusBadge :status="richiesta.stato" /></td>
            <td class="actions">
              <template v-if="richiesta.stato === 'in_attesa_caposala'">
                <Button
                  label="Approva"
                  size="small"
                  @click="emit('approve', richiesta)"
                />
                <Button
                  label="Rifiuta"
                  size="small"
                  severity="secondary"
                  @click="emit('reject', richiesta)"
                />
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

.actions {
  display: flex;
  gap: 8px;
}
</style>
