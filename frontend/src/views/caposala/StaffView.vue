<script setup lang="ts">
import { onMounted } from 'vue'
import Button from 'primevue/button'
import EiraTable from '@/components/ui/EiraTable.vue'
import InlineError from '@/components/ui/InlineError.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import TemporaryPasswordNotice from '@/features/staff/TemporaryPasswordNotice.vue'
import { useStaffWorkflow } from '@/features/staff/useStaffWorkflow'

const {
  filtro,
  loading,
  resetLoadingId,
  error,
  temporaryPassword,
  filtri,
  filtrati,
  load,
  approva,
  reimpostaPassword,
  copiaPassword,
} = useStaffWorkflow()

onMounted(load)
</script>

<template>
  <div class="staff-view">
    <PageHeader title="Personale" />

    <div class="filtri">
      <button
        v-for="f in filtri"
        :key="f.value"
        type="button"
        class="chip"
        :class="{ active: filtro === f.value }"
        @click="filtro = f.value"
      >
        {{ f.label }}
      </button>
    </div>

    <InlineError :message="error" />

    <EiraTable v-if="!loading" :empty="filtrati.length === 0" empty-message="Nessun utente in questo filtro.">
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
          <tr v-for="utente in filtrati" :key="utente.id">
            <td>{{ utente.nome }}</td>
            <td>{{ utente.cognome }}</td>
            <td>{{ utente.email }}</td>
            <td>{{ utente.ruolo }}</td>
            <td>
              <Button
                v-if="utente.stato === 'in_attesa'"
                label="Approva"
                size="small"
                @click="approva(utente)"
              />
              <Button
                v-else-if="utente.stato === 'attivo' && utente.ruolo === 'infermiere'"
                label="Reimposta password"
                size="small"
                severity="secondary"
                :loading="resetLoadingId === utente.id"
                @click="reimpostaPassword(utente)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </EiraTable>

    <TemporaryPasswordNotice
      v-if="temporaryPassword"
      :password="temporaryPassword"
      @copy="copiaPassword"
    />
  </div>
</template>

<style scoped>
.staff-view {
  padding: var(--page-padding);
  max-width: 960px;
  margin: 0 auto;
}

.filtri {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0;
}

.chip {
  padding: 6px 14px;
  min-height: var(--size-touch);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--steel);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
}

.chip.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-on-primary);
}

</style>
