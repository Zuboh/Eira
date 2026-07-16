<script setup lang="ts">
import Button from 'primevue/button'
import EiraTable from '@/components/ui/EiraTable.vue'
import type { ValutazioniTabEmits, ValutazioniTabProps } from '@/features/patient-chart/types'

defineProps<ValutazioniTabProps>()

const emit = defineEmits<ValutazioniTabEmits>()
</script>

<template>
  <div class="panel-header">
    <Button v-if="canCreate" label="Nuova Norton" size="small" @click="emit('newNorton')" />
    <Button v-if="canCreate" label="Nuova Conley" size="small" severity="secondary" @click="emit('newConley')" />
  </div>
  <h2>Norton</h2>
  <EiraTable class="clinical-table" :empty="norton.length === 0" empty-message="Nessuna valutazione Norton.">
    <table style="min-width: var(--table-min-wide)">
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
  </EiraTable>

  <h2>Conley</h2>
  <EiraTable class="clinical-table" :empty="conley.length === 0" empty-message="Nessuna valutazione Conley.">
    <table style="min-width: var(--table-min-wide)">
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
  </EiraTable>
</template>

<style scoped>
.panel-header { display: flex; gap: 8px; margin: 12px 0; }
.clinical-table { margin-bottom: 20px; }
</style>
