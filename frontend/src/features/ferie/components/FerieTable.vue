<script setup lang="ts">
import Button from 'primevue/button'
import StatusBadge from '@/components/StatusBadge.vue'
import EiraTable from '@/components/ui/EiraTable.vue'
import { formatDateShortIt, formatDateTimeCompactIt } from '@/utils/dateFormat'
import type { RichiestaFerie } from '@/api/ferie'

const props = defineProps<{
  richieste: RichiestaFerie[]
  currentRole: 'infermiere' | 'caposala' | null
  currentUserId: number | null
  nomeUtente: (id: number) => string
}>()

const emit = defineEmits<{
  approve: [richiesta: RichiestaFerie]
  reject: [richiesta: RichiestaFerie]
  edit: [richiesta: RichiestaFerie]
  cancel: [richiesta: RichiestaFerie]
}>()

function isOwn(richiesta: RichiestaFerie) {
  return richiesta.infermiere_id === props.currentUserId
}

function canEditOrCancel(richiesta: RichiestaFerie) {
  return (
    props.currentRole === 'infermiere' &&
    isOwn(richiesta) &&
    richiesta.stato === 'in_attesa'
  )
}

function canRespond(richiesta: RichiestaFerie) {
  return props.currentRole === 'caposala' && richiesta.stato === 'in_attesa'
}

function preferenzeOrdinate(richiesta: RichiestaFerie) {
  return richiesta.preferenze.slice().sort((a, b) => a.rank - b.rank)
}
</script>

<template>
  <EiraTable
    :empty="richieste.length === 0"
    empty-message="Nessuna richiesta di ferie."
  >
    <table>
      <thead>
        <tr>
          <th>Infermiere</th>
          <th>Preferenze</th>
          <th>Stato</th>
          <th>Creata</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="richiesta in richieste" :key="richiesta.id">
          <td>{{ nomeUtente(richiesta.infermiere_id) }}</td>
          <td>
            <ol v-if="richiesta.stato === 'in_attesa'" class="preferenze">
              <li v-for="p in preferenzeOrdinate(richiesta)" :key="p.rank">
                {{ formatDateShortIt(p.data_inizio) }} →
                {{ formatDateShortIt(p.data_fine) }}
              </li>
            </ol>
            <span
              v-else-if="richiesta.data_inizio && richiesta.data_fine"
              class="mono"
            >
              {{ formatDateShortIt(richiesta.data_inizio) }} →
              {{ formatDateShortIt(richiesta.data_fine) }}
            </span>
            <span v-else class="muted">—</span>
          </td>
          <td><StatusBadge :status="richiesta.stato" /></td>
          <td class="mono">
            {{ formatDateTimeCompactIt(richiesta.creata_il) }}
          </td>
          <td class="actions">
            <template v-if="canRespond(richiesta)">
              <Button
                label="Approva"
                size="small"
                @click="emit('approve', richiesta)"
              />
              <Button
                label="Rifiuta"
                size="small"
                severity="secondary"
                @click="emit('reject', richiesta)"
              />
            </template>
            <template v-if="canEditOrCancel(richiesta)">
              <Button
                label="Modifica"
                size="small"
                severity="secondary"
                @click="emit('edit', richiesta)"
              />
              <Button
                label="Annulla"
                size="small"
                severity="danger"
                text
                @click="emit('cancel', richiesta)"
              />
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </EiraTable>
</template>

<style scoped>
.actions {
  display: flex;
  gap: 8px;
}

.mono {
  font-family: var(--mono);
  font-size: 0.8125rem;
}

.muted {
  color: var(--steel);
}

.preferenze {
  margin: 0;
  padding-left: 1.1rem;
  font-family: var(--mono);
  font-size: 0.8125rem;
}
</style>
