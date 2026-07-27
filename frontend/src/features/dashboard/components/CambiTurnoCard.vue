<script setup lang="ts">
import Button from 'primevue/button'
import EiraCard from '@/components/ui/EiraCard.vue'
import EiraTable from '@/components/ui/EiraTable.vue'
import DashboardSectionHeader from '@/features/dashboard/components/DashboardSectionHeader.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import type { RichiestaCambioTurno } from '@/api/cambiTurno'
import { formatCambioRichiesto } from '@/features/cambi-turno/format'

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
  <EiraCard flush class="dashboard-card">
    <DashboardSectionHeader
      title="Cambi turno in attesa"
      route-name="cambio-turno"
      link-label="Vedi tutti"
    />
    <EiraTable
      flush
      :loading="loading"
      :empty="richieste.length === 0"
      empty-message="Nessun cambio turno in attesa."
    >
      <table>
        <thead>
          <tr>
            <th>Richiedente</th>
            <th>Collega</th>
            <th>Cambio</th>
            <th>Stato</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="richiesta in richieste" :key="richiesta.id">
            <td>{{ nomeUtente(richiesta.richiedente_id) }}</td>
            <td>{{ nomeUtente(richiesta.collega_id) }}</td>
            <td class="cambio">{{ formatCambioRichiesto(richiesta) }}</td>
            <td><StatusBadge :status="richiesta.stato" /></td>
            <td>
              <span class="actions">
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
                <span
                  v-else-if="richiesta.stato === 'in_attesa_collega'"
                  class="muted"
                >
                  In attesa del collega
                </span>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </EiraTable>
  </EiraCard>
</template>

<style scoped>
.actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.muted {
  color: var(--steel);
  font-size: 0.8125rem;
  white-space: nowrap;
}

.cambio {
  min-width: 15rem;
  font-weight: 600;
  white-space: nowrap;
}
</style>
