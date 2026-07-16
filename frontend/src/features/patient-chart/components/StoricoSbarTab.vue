<script setup lang="ts">
import StatusBadge from '@/components/StatusBadge.vue'
import type { ConsegnaSbar } from '@/api/consegneSbar'

defineProps<{
  consegne: ConsegnaSbar[]
}>()
</script>

<template>
  <div v-if="consegne.length > 0" class="table-scroll">
    <table class="data-table">
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
  </div>
  <p v-else class="hint">Nessuna consegna SBAR per questo paziente.</p>
</template>

<style scoped>
.data-table { width: 100%; min-width: 760px; border-collapse: collapse; }
.table-scroll { overflow-x: auto; margin-bottom: 20px; }
.data-table th { text-align: left; font-size: 0.8125rem; font-weight: 600; color: var(--steel); padding: 8px 12px; border-bottom: 1px solid var(--border); }
.data-table td { padding: 8px 12px; border-top: 1px solid var(--border); font-size: 0.875rem; }
.mono { font-family: var(--mono); font-size: 0.8125rem; }
.hint { color: var(--steel); font-size: 0.875rem; }
</style>
