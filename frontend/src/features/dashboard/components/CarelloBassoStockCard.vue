<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import StatusBadge from '@/components/StatusBadge.vue'
import EiraCard from '@/components/ui/EiraCard.vue'
import EiraTable from '@/components/ui/EiraTable.vue'
import DashboardSectionHeader from '@/features/dashboard/components/DashboardSectionHeader.vue'
import type { CarelloFarmaco } from '@/api/carelloFarmaci'

const props = defineProps<{
  farmaci: CarelloFarmaco[]
  loading: boolean
}>()

const alertRows = computed(() => props.farmaci.slice(0, 5))
const summary = computed(() =>
  alertRows.value.length === 1
    ? '1 attenzione'
    : `${alertRows.value.length} attenzioni`,
)

function giorniAllaScadenza(riga: CarelloFarmaco) {
  if (!riga.prossima_scadenza) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(`${riga.prossima_scadenza}T00:00:00`)
  return Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000)
}

function isLowStock(riga: CarelloFarmaco) {
  return riga.quantita < riga.soglia_minima
}

function isExpiring(riga: CarelloFarmaco) {
  const giorni = giorniAllaScadenza(riga)
  return giorni !== null && giorni <= 30
}

function expiryStatus(riga: CarelloFarmaco) {
  const giorni = giorniAllaScadenza(riga)
  return giorni !== null && giorni < 0 ? 'urgente' : 'pending'
}

function expiryLabel(riga: CarelloFarmaco) {
  const giorni = giorniAllaScadenza(riga)
  if (giorni === null) return ''
  if (giorni < 0) return 'Scaduto'
  if (giorni === 0) return 'Scade oggi'
  return `Scade tra ${giorni} gg`
}

function formatScadenza(value: string | null | undefined) {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString('it-IT') : '—'
}
</script>

<template>
  <EiraCard class="dashboard-card">
    <DashboardSectionHeader
      title="Carello farmaci"
      route-name="carello-farmaci"
      link-label="Apri carello"
    />
    <p class="summary">{{ summary }}</p>
    <EiraTable
      :loading="loading"
      :empty="alertRows.length === 0"
      empty-message="Nessuna criticità farmaci."
    >
      <table>
        <thead>
          <tr>
            <th>Farmaco</th>
            <th>Q.tà</th>
            <th>Scadenza</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="riga in alertRows" :key="riga.id">
            <td>
              <RouterLink :to="{ name: 'carello-farmaci' }">
                {{ riga.farmaco.nome }}
              </RouterLink>
              <span class="meta">
                {{ riga.farmaco.categoria }} · {{ riga.farmaco.unita_misura }}
              </span>
            </td>
            <td>
              {{ riga.quantita }}/{{ riga.soglia_minima }}
              <StatusBadge v-if="isLowStock(riga)" status="urgente" label="Basso" />
            </td>
            <td>
              {{ formatScadenza(riga.prossima_scadenza) }}
              <StatusBadge
                v-if="isExpiring(riga)"
                :status="expiryStatus(riga)"
                :label="expiryLabel(riga)"
              />
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

.summary,
.meta {
  color: var(--steel);
  font-size: 0.8125rem;
}

.summary {
  margin: -4px 0 12px;
}

.meta {
  display: block;
  margin-top: 2px;
}
</style>
