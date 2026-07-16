<script setup lang="ts">
import EiraCard from '@/components/ui/EiraCard.vue'
import EiraTable from '@/components/ui/EiraTable.vue'
import { TIPO_TURNO_LABEL } from '@/features/turni/constants'
import { formatDateShortIt } from '@/utils/dateFormat'
import type { ProssimiTurniCardProps } from '@/features/dashboard/types'

defineProps<ProssimiTurniCardProps>()
</script>

<template>
  <EiraCard title="Prossimi turni" class="dashboard-card">
    <EiraTable v-if="!loading" :empty="turni.length === 0" empty-message="Nessun turno assegnato.">
      <table>
        <thead>
          <tr><th>Data</th><th>Turno</th><th>Orario</th></tr>
        </thead>
        <tbody>
          <tr v-for="turno in turni" :key="turno.id">
            <td>{{ formatDateShortIt(turno.data) }}</td>
            <td>{{ TIPO_TURNO_LABEL[turno.tipo] }}</td>
            <td class="mono">{{ turno.ora_inizio.slice(0, 5) }}–{{ turno.ora_fine.slice(0, 5) }}</td>
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
</style>
