<script setup lang="ts">
import Button from 'primevue/button'
import EiraTable from '@/components/ui/EiraTable.vue'
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
  <EiraTable class="clinical-table" :empty="entries.length === 0" empty-message="Nessuna voce diario CEDEMA.">
    <table style="min-width: var(--table-min-wide)">
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
  </EiraTable>
</template>

<style scoped>
.panel-header { display: flex; gap: 8px; margin: 12px 0; }
.clinical-table { margin-bottom: 20px; }
</style>
