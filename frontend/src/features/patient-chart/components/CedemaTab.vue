<script setup lang="ts">
import Button from 'primevue/button'
import type { VoceDiarioCedema } from '@/api/diarioCedema'

defineProps<{
  entries: VoceDiarioCedema[]
  canCreate: boolean
}>()

const emit = defineEmits<{
  newEntry: []
}>()
</script>

<template>
  <div class="panel-header">
    <Button v-if="canCreate" label="Nuova voce" size="small" @click="emit('newEntry')" />
  </div>
  <div v-if="entries.length > 0" class="table-scroll">
    <table class="data-table">
      <thead>
        <tr>
          <th>Data</th><th>Coscienza</th><th>Emotività</th><th>Dolore</th><th>Emodinamica</th><th>Mobilizzazione</th><th>Allert</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="v in entries" :key="v.id">
          <td class="mono">{{ v.timestamp.slice(0, 16).replace('T', ' ') }}</td>
          <td>{{ v.coscienza }}</td>
          <td>{{ v.emotivita }}</td>
          <td>{{ v.dolore }}</td>
          <td>{{ v.emodinamica }}</td>
          <td>{{ v.mobilizzazione }}</td>
          <td>{{ v.allert }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <p v-else class="hint">Nessuna voce diario CEDEMA.</p>
</template>

<style scoped>
.panel-header { display: flex; gap: 8px; margin: 12px 0; }
.data-table { width: 100%; min-width: 760px; border-collapse: collapse; }
.table-scroll { overflow-x: auto; margin-bottom: 20px; }
.data-table th { text-align: left; font-size: 0.8125rem; font-weight: 600; color: var(--steel); padding: 8px 12px; border-bottom: 1px solid var(--border); }
.data-table td { padding: 8px 12px; border-top: 1px solid var(--border); font-size: 0.875rem; }
.mono { font-family: var(--mono); font-size: 0.8125rem; }
.hint { color: var(--steel); font-size: 0.875rem; }
</style>
