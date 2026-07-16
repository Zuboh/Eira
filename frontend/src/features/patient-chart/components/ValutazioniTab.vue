<script setup lang="ts">
import Button from 'primevue/button'
import type { ValutazioneConley, ValutazioneNorton } from '@/api/valutazioni'

defineProps<{
  norton: ValutazioneNorton[]
  conley: ValutazioneConley[]
  canCreate: boolean
}>()

const emit = defineEmits<{
  newNorton: []
  newConley: []
}>()
</script>

<template>
  <div class="panel-header">
    <Button v-if="canCreate" label="Nuova Norton" size="small" @click="emit('newNorton')" />
    <Button v-if="canCreate" label="Nuova Conley" size="small" severity="secondary" @click="emit('newConley')" />
  </div>
  <h2>Norton</h2>
  <div v-if="norton.length > 0" class="table-scroll">
    <table class="data-table">
      <thead>
        <tr><th>Data</th><th>Cond. gen.</th><th>Stato mentale</th><th>Attività</th><th>Mobilità</th><th>Incontinenza</th><th>Totale</th></tr>
      </thead>
      <tbody>
        <tr v-for="n in norton" :key="n.id">
          <td class="mono">{{ n.data_valutazione }}</td>
          <td>{{ n.condizioni_generali }}</td>
          <td>{{ n.stato_mentale }}</td>
          <td>{{ n.attivita }}</td>
          <td>{{ n.mobilita }}</td>
          <td>{{ n.incontinenza }}</td>
          <td class="mono"><strong>{{ n.punteggio_totale }}</strong></td>
        </tr>
      </tbody>
    </table>
  </div>
  <p v-else class="hint">Nessuna valutazione Norton.</p>

  <h2>Conley</h2>
  <div v-if="conley.length > 0" class="table-scroll">
    <table class="data-table">
      <thead>
        <tr><th>Data</th><th>Cadute</th><th>Deficit visivo</th><th>Eliminazione</th><th>Agitazione</th><th>Vista oss.</th><th>Andatura</th><th>Totale</th></tr>
      </thead>
      <tbody>
        <tr v-for="c in conley" :key="c.id">
          <td class="mono">{{ c.data_valutazione }}</td>
          <td>{{ c.storia_cadute }}</td>
          <td>{{ c.deficit_visivo }}</td>
          <td>{{ c.alterazione_eliminazione }}</td>
          <td>{{ c.agitazione }}</td>
          <td>{{ c.deficit_vista_osservato }}</td>
          <td>{{ c.andatura_alterata }}</td>
          <td class="mono"><strong>{{ c.punteggio_totale }}</strong></td>
        </tr>
      </tbody>
    </table>
  </div>
  <p v-else class="hint">Nessuna valutazione Conley.</p>
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
