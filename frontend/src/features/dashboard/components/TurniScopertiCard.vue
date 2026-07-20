<script setup lang="ts">
import Button from 'primevue/button'
import EiraCard from '@/components/ui/EiraCard.vue'
import EiraTable from '@/components/ui/EiraTable.vue'
import type { DashboardCaposala } from '@/api/dashboard'
import type { Turno } from '@/api/turni'
import { TIPO_TURNO_LABEL } from '@/features/turni/constants'
import { formatDateShortIt } from '@/utils/dateFormat'

defineProps<{
  turni: DashboardCaposala['turni_scoperti']
  loading: boolean
}>()

const emit = defineEmits<{
  assign: [turno: Turno]
}>()
</script>

<template>
  <EiraCard title="Turni da coprire" class="dashboard-card">
    <EiraTable
      :loading="loading"
      :empty="turni.length === 0"
      empty-message="Tutti i turni hanno almeno 2 infermieri."
    >
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Turno</th>
            <th>Orario</th>
            <th><span class="sr-only">Azioni</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="turno in turni" :key="turno.id">
            <td>{{ formatDateShortIt(turno.data) }}</td>
            <td>{{ TIPO_TURNO_LABEL[turno.tipo] }}</td>
            <td class="mono">
              {{ turno.ora_inizio.slice(0, 5) }}–{{
                turno.ora_fine.slice(0, 5)
              }}
            </td>
            <td class="actions">
              <Button
                label="Assegna"
                size="small"
                @click="emit('assign', turno)"
              />
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
