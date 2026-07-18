<script setup lang="ts">
import Button from 'primevue/button'
import StatusBadge from '@/components/StatusBadge.vue'
import EiraTable from '@/components/ui/EiraTable.vue'
import { formatDateTimeCompactIt } from '@/utils/dateFormat'
import type {
  CambiTurnoTableEmits,
  CambiTurnoTableProps,
} from '@/features/cambi-turno/types'

const props = defineProps<CambiTurnoTableProps>()

const emit = defineEmits<CambiTurnoTableEmits>()

function canAnswerAsColleague(
  richiesta: CambiTurnoTableProps['richieste'][number],
) {
  return (
    props.currentRole === 'infermiere' &&
    richiesta.collega_id === props.currentUserId &&
    richiesta.stato === 'in_attesa_collega'
  )
}

function canAnswerAsCaposala(
  richiesta: CambiTurnoTableProps['richieste'][number],
) {
  return (
    props.currentRole === 'caposala' && richiesta.stato === 'in_attesa_caposala'
  )
}

function canCancel(richiesta: CambiTurnoTableProps['richieste'][number]) {
  return (
    richiesta.richiedente_id === props.currentUserId &&
    (richiesta.stato === 'in_attesa_collega' ||
      richiesta.stato === 'in_attesa_caposala')
  )
}
</script>

<template>
  <EiraTable
    :empty="richieste.length === 0"
    empty-message="Nessuna richiesta di cambio turno."
  >
    <table>
      <thead>
        <tr>
          <th>Richiedente</th>
          <th>Collega</th>
          <th>Stato</th>
          <th>Creata</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="richiesta in richieste" :key="richiesta.id">
          <td>{{ nomeUtente(richiesta.richiedente_id) }}</td>
          <td>{{ nomeUtente(richiesta.collega_id) }}</td>
          <td><StatusBadge :status="richiesta.stato" /></td>
          <td class="mono">
            {{ formatDateTimeCompactIt(richiesta.creata_il) }}
          </td>
          <td class="actions">
            <template v-if="canAnswerAsColleague(richiesta)">
              <Button
                label="Accetta"
                size="small"
                @click="emit('colleagueResponse', richiesta, true)"
              />
              <Button
                label="Rifiuta"
                size="small"
                severity="secondary"
                @click="emit('colleagueResponse', richiesta, false)"
              />
            </template>
            <template v-else-if="canAnswerAsCaposala(richiesta)">
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
            <Button
              v-if="canCancel(richiesta)"
              label="Annulla"
              size="small"
              severity="danger"
              text
              @click="emit('cancel', richiesta)"
            />
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
</style>
