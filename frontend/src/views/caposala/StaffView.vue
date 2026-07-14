<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Button from 'primevue/button'
import { listUtenti, updateUtente, type Utente, type StatoUtente } from '@/api/utenti'

const utenti = ref<Utente[]>([])
const filtro = ref<StatoUtente>('in_attesa')
const loading = ref(false)
const error = ref('')

const filtri: { value: StatoUtente; label: string }[] = [
  { value: 'in_attesa', label: 'In attesa' },
  { value: 'attivo', label: 'Attivi' },
  { value: 'disattivato', label: 'Disattivati' },
]

const filtrati = computed(() => utenti.value.filter((u) => u.stato === filtro.value))

async function load() {
  error.value = ''
  loading.value = true
  try {
    const { data } = await listUtenti()
    utenti.value = data
  } catch {
    error.value = 'Impossibile caricare il personale.'
  } finally {
    loading.value = false
  }
}

async function approva(utente: Utente) {
  try {
    await updateUtente(utente.id, { stato: 'attivo' })
    utente.stato = 'attivo'
  } catch {
    error.value = 'Impossibile approvare l\'utente.'
  }
}

onMounted(load)
</script>

<template>
  <div class="staff-view">
    <h1>Personale</h1>

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

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <table v-if="!loading && filtrati.length > 0" class="staff-table">
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
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else-if="!loading" class="hint">Nessun utente in questo filtro.</p>
  </div>
</template>

<style scoped>
.staff-view {
  padding: 32px;
  max-width: 960px;
  margin: 0 auto;
}

.filtri {
  display: flex;
  gap: 8px;
  margin: 16px 0;
}

.chip {
  padding: 6px 14px;
  min-height: 44px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--steel);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
}

.chip.active {
  background: var(--color-primary, #3b82f6);
  border-color: var(--color-primary, #3b82f6);
  color: #fff;
}

.staff-table {
  width: 100%;
  border-collapse: collapse;
}

.staff-table th {
  text-align: left;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--steel);
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
}

.staff-table td {
  padding: 8px 12px;
  border-top: 1px solid var(--border);
  font-size: 0.9375rem;
}

.error {
  color: var(--state-urgente);
  font-size: 0.8125rem;
}

.hint {
  color: var(--steel);
  font-size: 0.875rem;
}
</style>
