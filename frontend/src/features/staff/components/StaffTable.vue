<script setup lang="ts">
import Button from 'primevue/button'
import EiraTable from '@/components/ui/EiraTable.vue'
import type { StaffTableEmits, StaffTableProps } from '@/features/staff/types'

defineProps<StaffTableProps>()

const emit = defineEmits<StaffTableEmits>()
</script>

<template>
  <EiraTable :empty="utenti.length === 0" empty-message="Nessun utente in questo filtro.">
    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Cognome</th>
          <th>Email</th>
          <th>Ruolo</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="utente in utenti" :key="utente.id">
          <td>{{ utente.nome }}</td>
          <td>{{ utente.cognome }}</td>
          <td>{{ utente.email }}</td>
          <td>{{ utente.ruolo }}</td>
          <td>
            <Button
              v-if="utente.stato === 'in_attesa'"
              label="Approva"
              size="small"
              @click="emit('approve', utente)"
            />
            <Button
              v-else-if="utente.stato === 'attivo' && utente.ruolo === 'infermiere'"
              label="Reimposta password"
              size="small"
              severity="secondary"
              :loading="resetLoadingId === utente.id"
              @click="emit('resetPassword', utente)"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </EiraTable>
</template>
