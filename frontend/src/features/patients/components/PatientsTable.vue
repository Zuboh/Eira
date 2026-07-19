<script setup lang="ts">
import { useRouter } from 'vue-router'
import StatusBadge from '@/components/StatusBadge.vue'
import EiraTable from '@/components/ui/EiraTable.vue'
import type { PatientsTableProps } from '@/features/patients/types'

defineProps<PatientsTableProps>()

const router = useRouter()

function goToPaziente(id: number) {
  router.push({ name: 'paziente-scheda', params: { id } })
}
</script>

<template>
  <EiraTable :loading="loading">
    <table class="pazienti-table">
      <thead>
        <tr>
          <th>Cognome</th>
          <th>Nome</th>
          <th>Età</th>
          <th>Letto</th>
          <th>Diagnosi</th>
          <th>Ricovero</th>
          <th>Stato</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="patient in patients"
          :key="patient.id"
          class="row"
          role="link"
          tabindex="0"
          @click="goToPaziente(patient.id)"
          @keydown.enter="goToPaziente(patient.id)"
          @keydown.space.prevent="goToPaziente(patient.id)"
        >
          <td class="cognome">{{ patient.cognome }}</td>
          <td>{{ patient.nome }}</td>
          <td class="mono">{{ patient.eta }}</td>
          <td class="mono">{{ patient.letto }}</td>
          <td>{{ patient.diagnosi_ingresso }}</td>
          <td class="mono">{{ patient.data_ricovero }}</td>
          <td>
            <StatusBadge
              :status="patient.dimesso ? 'dimesso' : 'attivo'"
              :label="patient.dimesso ? 'Dimesso' : 'Attivo'"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </EiraTable>
</template>

<style scoped>
.pazienti-table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
}

.row {
  cursor: pointer;
  transition: background 150ms ease-out;
}

.row:hover {
  background: var(--canvas);
}

.row:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.cognome {
  font-weight: 600;
}

.mono {
  font-family: var(--mono);
  font-size: 0.8125rem;
}
</style>
