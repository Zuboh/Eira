<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import { useAuthStore } from '@/stores/auth'
import StatusBadge from '@/components/StatusBadge.vue'
import {
  listCambiTurno,
  createRichiestaCambioTurno,
  rispondiCollega,
  rispondiCaposala,
  type RichiestaCambioTurno,
} from '@/api/cambiTurno'
import { getMieAssegnazioni, type AssegnazioneTurno } from '@/api/turni'
import { listUtenti, type Utente } from '@/api/utenti'

const auth = useAuthStore()

const richieste = ref<RichiestaCambioTurno[]>([])
const utenti = ref<Utente[]>([])
const assegnazioni = ref<AssegnazioneTurno[]>([])
const loading = ref(false)
const error = ref('')

function nomeUtente(id: number) {
  const u = utenti.value.find((u) => u.id === id)
  return u ? `${u.cognome} ${u.nome}` : `#${id}`
}

const colleghi = computed(() =>
  utenti.value.filter((u) => u.ruolo === 'infermiere' && u.id !== auth.user?.id),
)

async function load() {
  error.value = ''
  loading.value = true
  try {
    const [r, u] = await Promise.all([listCambiTurno(), listUtenti()])
    richieste.value = r.data
    utenti.value = u.data
    if (auth.ruolo === 'infermiere') {
      const a = await getMieAssegnazioni()
      assegnazioni.value = a.data
    }
  } catch {
    error.value = 'Impossibile caricare le richieste di cambio turno.'
  } finally {
    loading.value = false
  }
}

const dialogOpen = ref(false)
const saving = ref(false)
const form = ref({ assegnazione_turno_id: null as number | null, collega_id: null as number | null })

function apriNuova() {
  form.value = { assegnazione_turno_id: null, collega_id: null }
  dialogOpen.value = true
}

async function salva() {
  if (!form.value.assegnazione_turno_id || !form.value.collega_id) return
  saving.value = true
  error.value = ''
  try {
    await createRichiestaCambioTurno({
      assegnazione_turno_id: form.value.assegnazione_turno_id,
      collega_id: form.value.collega_id,
    })
    dialogOpen.value = false
    await load()
  } catch {
    error.value = 'Impossibile creare la richiesta.'
  } finally {
    saving.value = false
  }
}

async function rispondiComeCollega(r: RichiestaCambioTurno, accetta: boolean) {
  try {
    await rispondiCollega(r.id, { accetta })
    await load()
  } catch {
    error.value = 'Impossibile rispondere alla richiesta.'
  }
}

const rifiutoDialog = ref(false)
const rifiutoTarget = ref<RichiestaCambioTurno | null>(null)
const motivoRifiuto = ref('')

function apriRifiuto(r: RichiestaCambioTurno) {
  rifiutoTarget.value = r
  motivoRifiuto.value = ''
  rifiutoDialog.value = true
}

async function approvaCaposala(r: RichiestaCambioTurno) {
  try {
    await rispondiCaposala(r.id, { accetta: true })
    await load()
  } catch {
    error.value = 'Impossibile approvare la richiesta.'
  }
}

async function confermaRifiuto() {
  if (!rifiutoTarget.value) return
  try {
    await rispondiCaposala(rifiutoTarget.value.id, { accetta: false, motivo_rifiuto: motivoRifiuto.value })
    rifiutoDialog.value = false
    await load()
  } catch {
    error.value = 'Impossibile rifiutare la richiesta.'
  }
}

onMounted(load)
</script>

<template>
  <div class="cambio-view">
    <div class="header">
      <h1>Cambio Turno</h1>
      <Button v-if="auth.ruolo === 'infermiere'" label="Richiedi cambio" size="small" @click="apriNuova" />
    </div>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <table v-if="!loading && richieste.length > 0" class="data-table">
      <thead>
        <tr><th>Richiedente</th><th>Collega</th><th>Stato</th><th>Creata</th><th></th></tr>
      </thead>
      <tbody>
        <tr v-for="r in richieste" :key="r.id">
          <td>{{ nomeUtente(r.richiedente_id) }}</td>
          <td>{{ nomeUtente(r.collega_id) }}</td>
          <td><StatusBadge :status="r.stato" /></td>
          <td class="mono">{{ r.creata_il.slice(0, 16).replace('T', ' ') }}</td>
          <td class="actions">
            <template v-if="auth.ruolo === 'infermiere' && r.collega_id === auth.user?.id && r.stato === 'in_attesa_collega'">
              <Button label="Accetta" size="small" @click="rispondiComeCollega(r, true)" />
              <Button label="Rifiuta" size="small" severity="secondary" @click="rispondiComeCollega(r, false)" />
            </template>
            <template v-else-if="auth.ruolo === 'caposala' && r.stato === 'in_attesa_caposala'">
              <Button label="Approva" size="small" @click="approvaCaposala(r)" />
              <Button label="Rifiuta" size="small" severity="secondary" @click="apriRifiuto(r)" />
            </template>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else-if="!loading" class="hint">Nessuna richiesta di cambio turno.</p>

    <Dialog v-model:visible="dialogOpen" header="Richiedi cambio turno" modal :style="{ width: '24rem' }">
      <form class="form" @submit.prevent="salva">
        <label>
          Tuo turno
          <Select v-model="form.assegnazione_turno_id" :options="assegnazioni" optionLabel="turno_id" optionValue="id" placeholder="Seleziona assegnazione" required />
        </label>
        <label>
          Collega
          <Select v-model="form.collega_id" :options="colleghi" optionLabel="cognome" optionValue="id" placeholder="Seleziona collega" required />
        </label>
        <Button type="submit" label="Invia richiesta" :loading="saving" />
      </form>
    </Dialog>

    <Dialog v-model:visible="rifiutoDialog" header="Motivo rifiuto" modal :style="{ width: '24rem' }">
      <form class="form" @submit.prevent="confermaRifiuto">
        <label>Motivo<InputText v-model="motivoRifiuto" /></label>
        <Button type="submit" label="Conferma rifiuto" severity="secondary" />
      </form>
    </Dialog>
  </div>
</template>

<style scoped>
.cambio-view {
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
}

.data-table th {
  text-align: left;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--steel);
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
}

.data-table td {
  padding: 8px 12px;
  border-top: 1px solid var(--border);
  font-size: 0.875rem;
}

.actions {
  display: flex;
  gap: 8px;
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
