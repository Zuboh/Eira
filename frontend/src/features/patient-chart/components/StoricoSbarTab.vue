<script setup lang="ts">
import StatusBadge from '@/components/StatusBadge.vue'
import EiraTable from '@/components/ui/EiraTable.vue'
import type { ConsegnaSbar } from '@/api/consegneSbar'

defineProps<{
  consegne: ConsegnaSbar[]
}>()
</script>

<template>
  <EiraTable class="clinical-table" :empty="consegne.length === 0" empty-message="Nessuna consegna SBAR per questo paziente.">
    <table style="min-width: var(--table-min-wide)">
      <thead>
        <tr><th>Data</th><th>Priorità</th><th>Situation</th><th>Background</th><th>Assessment</th><th>Recommendation</th></tr>
      </thead>
      <tbody>
        <tr v-for="c in consegne" :key="c.id">
          <td class="mono">{{ c.creata_il.slice(0, 16).replace('T', ' ') }}</td>
          <td><StatusBadge :status="c.priorita" /></td>
          <td>{{ c.situation }}</td>
          <td>{{ c.background }}</td>
          <td>{{ c.assessment }}</td>
          <td>{{ c.recommendation }}</td>
        </tr>
      </tbody>
    </table>
  </EiraTable>
</template>

<style scoped>
.clinical-table { margin-bottom: 20px; }
</style>
