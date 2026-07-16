<script setup lang="ts">
import { RouterLink } from 'vue-router'
import StatusBadge from '@/components/StatusBadge.vue'
import EiraTable from '@/components/ui/EiraTable.vue'
import type { PatientsTableProps } from '@/features/patients/types'

defineProps<PatientsTableProps>()
</script>

<template>
  <EiraTable>
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
        <tr v-for="patient in patients" :key="patient.id" class="row">
          <td>
            <RouterLink class="patient-link" :to="{ name: 'paziente-scheda', params: { id: patient.id } }">
              {{ patient.cognome }}
            </RouterLink>
          </td>
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
  transition: background 150ms ease-out;
}

.row:hover {
  background: var(--canvas);
}

.patient-link {
  color: inherit;
  font-weight: 600;
  text-decoration: none;
}

.patient-link:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.mono {
  font-family: var(--mono);
  font-size: 0.8125rem;
}
</style>
