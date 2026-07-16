<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import DatePicker from 'primevue/datepicker'
import { useAuthStore } from '@/stores/auth'
import StatusBadge from '@/components/StatusBadge.vue'
import { listPazienti, createPaziente, type Paziente } from '@/api/pazienti'

const auth = useAuthStore()
const router = useRouter()

const pazienti = ref<Paziente[]>([])
const loading = ref(false)
const error = ref('')

const dialogOpen = ref(false)
const saving = ref(false)
const form = ref({
  nome: '',
  cognome: '',
  eta: null as number | null,
  letto: '',
  data_ricovero: new Date(),
  diagnosi_ingresso: '',
})

async function load() {
  error.value = ''
  loading.value = true
  try {
    const { data } = await listPazienti()
    pazienti.value = data
  } catch {
    error.value = 'Impossibile caricare i pazienti.'
  } finally {
    loading.value = false
  }
}

function apri(paziente: Paziente) {
  router.push({ name: 'paziente-scheda', params: { id: paziente.id } })
}

function apriNuovo() {
  form.value = {
    nome: '',
    cognome: '',
    eta: null,
    letto: '',
    data_ricovero: new Date(),
    diagnosi_ingresso: '',
  }
  dialogOpen.value = true
}

async function salva() {
  if (!form.value.eta) return
  saving.value = true
  error.value = ''
  try {
    await createPaziente({
      nome: form.value.nome,
      cognome: form.value.cognome,
      eta: form.value.eta,
      letto: form.value.letto,
      data_ricovero: form.value.data_ricovero.toISOString().slice(0, 10),
      diagnosi_ingresso: form.value.diagnosi_ingresso,
      reparto_id: auth.user!.reparto_id,
    })
    dialogOpen.value = false
    await load()
  } catch {
    error.value = 'Impossibile creare il paziente.'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="pazienti-view">
    <div class="header">
      <h1>Pazienti</h1>
      <Button v-if="auth.ruolo === 'caposala'" label="Nuovo paziente" size="small" @click="apriNuovo" />
    </div>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <table v-if="!loading && pazienti.length > 0" class="pazienti-table">
      <thead>
        <tr>
          <th>Cognome</th>
          <th>Nome</th>
          <th>Età</th>
          <th>Letto</th>
          <th>Diagnosi</th>
          <th>Ricovero</th>
          <th>Stato</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in pazienti" :key="p.id" class="row" @click="apri(p)">
          <td>{{ p.cognome }}</td>
          <td>{{ p.nome }}</td>
          <td class="mono">{{ p.eta }}</td>
          <td class="mono">{{ p.letto }}</td>
          <td>{{ p.diagnosi_ingresso }}</td>
          <td class="mono">{{ p.data_ricovero }}</td>
          <td><StatusBadge :status="p.dimesso ? 'dimesso' : 'attivo'" :label="p.dimesso ? 'Dimesso' : 'Attivo'" /></td>
        </tr>
      </tbody>
    </table>

    <p v-if="!loading && pazienti.length === 0 && auth.ruolo === 'infermiere'" class="hint">
      Nessun turno attivo assegnato: nessun paziente visibile.
    </p>
    <p v-else-if="!loading && pazienti.length === 0" class="hint">Nessun paziente in reparto.</p>

    <Dialog v-model:visible="dialogOpen" header="Nuovo paziente" modal :style="{ width: '28rem' }">
      <form class="form" @submit.prevent="salva">
        <label>Nome<InputText v-model="form.nome" required /></label>
        <label>Cognome<InputText v-model="form.cognome" required /></label>
        <label>Età<InputNumber v-model="form.eta" :min="0" :max="120" required /></label>
        <label>Letto<InputText v-model="form.letto" required /></label>
        <label>Data ricovero<DatePicker v-model="form.data_ricovero" dateFormat="yy-mm-dd" required /></label>
        <label>Diagnosi ingresso<InputText v-model="form.diagnosi_ingresso" required /></label>
        <Button type="submit" label="Crea" :loading="saving" />
      </form>
    </Dialog>
  </div>
</template>

<style scoped>
.pazienti-view {
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pazienti-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
}

.pazienti-table th {
  text-align: left;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--steel);
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
}

.pazienti-table td {
  padding: 8px 12px;
  border-top: 1px solid var(--border);
  font-size: 0.9375rem;
}

.row {
  cursor: pointer;
}

.row:hover {
  background: var(--canvas);
}

.mono {
  font-family: var(--mono);
  font-size: 0.8125rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--steel);
}

.error {
  color: var(--state-urgente);
  font-size: 0.8125rem;
}

.hint {
  color: var(--steel);
  font-size: 0.875rem;
  margin-top: 16px;
}
</style>
