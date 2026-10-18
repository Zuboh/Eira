<script setup lang="ts">
import { RouterLink } from 'vue-router'
import StatusBadge from '@/components/StatusBadge.vue'
import EiraTable from '@/components/ui/EiraTable.vue'
import type { PatientsTableProps } from '@/features/patients/types'
defineProps<PatientsTableProps>()
</script>

<template>
  <EiraTable label="Pazienti del reparto" flush :loading="loading">
    <table class="pazienti-table">
      <thead>
        <tr>
          <th>Paziente</th>
          <th class="numeric">Età</th>
          <th>Letto</th>
          <th>Diagnosi</th>
          <th>Ricovero</th>
          <th>Stato</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="patient in patients" :key="patient.id">
          <td>
            <RouterLink
              :to="{ name: 'paziente-scheda', params: { id: patient.id } }"
              >{{ patient.cognome }} {{ patient.nome }}</RouterLink
            >
          </td>
          <td class="numeric">{{ patient.eta }}</td>
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
  min-width: var(--eira-table-min-wide);
}
</style>
