<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import { useAuthStore } from '@/stores/auth'
import { dialogStyle } from '@/components/ui/dialogStyles'
import StatusBadge from '@/components/StatusBadge.vue'
import {
  listConsegneSbar,
  createConsegnaSbar,
  updateConsegnaSbar,
  type ConsegnaSbar,
  type PrioritaConsegna,
} from '@/api/consegneSbar'
import { listPazienti, type Paziente } from '@/api/pazienti'
import { getMieAssegnazioni, type AssegnazioneTurno } from '@/api/turni'

const auth = useAuthStore()

const consegne = ref<ConsegnaSbar[]>([])
const pazienti = ref<Paziente[]>([])
const assegnazioni = ref<AssegnazioneTurno[]>([])
const loading = ref(false)
const error = ref('')

const pazientiById = computed(() => new Map(pazienti.value.map((p) => [p.id, p])))

function nomePaziente(id: number) {
  const p = pazientiById.value.get(id)
  return p ? `${p.cognome} ${p.nome}` : `#${id}`
}

async function loadAssegnazioniIfNeeded() {
  if (auth.ruolo !== 'infermiere' || assegnazioni.value.length > 0) return

  const { data } = await getMieAssegnazioni()
  assegnazioni.value = data
}

async function load() {
  error.value = ''
  loading.value = true
  try {
    const [c, p] = await Promise.all([listConsegneSbar(), listPazienti()])
    consegne.value = c.data
    pazienti.value = p.data
  } catch {
    error.value = 'Impossibile caricare le consegne SBAR.'
  } finally {
    loading.value = false
  }
}

const priorita: { value: PrioritaConsegna; label: string }[] = [
  { value: 'normale', label: 'Normale' },
  { value: 'urgente', label: 'Urgente' },
]

const dialogOpen = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const form = ref({
  paziente_id: null as number | null,
  turno_id: null as number | null,
  situation: '',
  background: '',
  assessment: '',
  recommendation: '',
  priorita: 'normale' as PrioritaConsegna,
})

async function apriNuova() {
  editingId.value = null
  form.value = {
    paziente_id: null,
    turno_id: null,
    situation: '',
    background: '',
    assessment: '',
    recommendation: '',
    priorita: 'normale',
  }
  dialogOpen.value = true
  try {
    await loadAssegnazioniIfNeeded()
  } catch {
    error.value = 'Impossibile caricare i turni assegnati.'
  }
}

function apriEdit(c: ConsegnaSbar) {
  editingId.value = c.id
  form.value = {
    paziente_id: c.paziente_id,
    turno_id: c.turno_id,
    situation: c.situation,
    background: c.background,
    assessment: c.assessment,
    recommendation: c.recommendation,
    priorita: c.priorita,
  }
  dialogOpen.value = true
}

async function salva() {
  saving.value = true
  error.value = ''
  try {
    if (editingId.value) {
      await updateConsegnaSbar(editingId.value, {
        situation: form.value.situation,
        background: form.value.background,
        assessment: form.value.assessment,
        recommendation: form.value.recommendation,
        priorita: form.value.priorita,
      })
    } else {
      if (!form.value.paziente_id || !form.value.turno_id) return
      await createConsegnaSbar({
        paziente_id: form.value.paziente_id,
        turno_id: form.value.turno_id,
        situation: form.value.situation,
        background: form.value.background,
        assessment: form.value.assessment,
        recommendation: form.value.recommendation,
        priorita: form.value.priorita,
      })
    }
    dialogOpen.value = false
    await load()
  } catch {
    error.value = 'Impossibile salvare la consegna.'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="sbar-view">
    <div class="header">
      <h1>Consegne SBAR</h1>
      <Button v-if="auth.ruolo === 'infermiere'" label="Nuova consegna" size="small" @click="apriNuova" />
    </div>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <div v-if="!loading && consegne.length > 0" class="table-scroll">
      <table class="data-table">
        <thead>
          <tr><th>Data</th><th>Paziente</th><th>Priorità</th><th>Situation</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="c in consegne" :key="c.id">
            <td class="mono">{{ c.creata_il.slice(0, 16).replace('T', ' ') }}</td>
            <td>{{ nomePaziente(c.paziente_id) }}</td>
            <td><StatusBadge :status="c.priorita" /></td>
            <td>{{ c.situation }}</td>
            <td>
              <Button
                v-if="auth.user && c.autore_id === auth.user.id"
                label="Modifica"
                size="small"
                severity="secondary"
                @click="apriEdit(c)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else-if="!loading" class="hint">Nessuna consegna SBAR.</p>

    <Dialog v-model:visible="dialogOpen" :header="editingId ? 'Modifica consegna' : 'Nuova consegna'" modal :style="dialogStyle.lg">
      <form class="form" @submit.prevent="salva">
        <template v-if="!editingId">
          <label>
            Paziente
            <Select v-model="form.paziente_id" :options="pazienti" optionLabel="cognome" optionValue="id" placeholder="Seleziona paziente" required />
          </label>
          <label>
            Turno
            <Select v-model="form.turno_id" :options="assegnazioni" optionLabel="turno_id" optionValue="turno_id" placeholder="Seleziona turno" required />
          </label>
        </template>
        <label>Priorità<Select v-model="form.priorita" :options="priorita" optionLabel="label" optionValue="value" /></label>
        <label>Situation<Textarea v-model="form.situation" rows="2" required /></label>
        <label>Background<Textarea v-model="form.background" rows="2" required /></label>
        <label>Assessment<Textarea v-model="form.assessment" rows="2" required /></label>
        <label>Recommendation<Textarea v-model="form.recommendation" rows="2" required /></label>
        <Button type="submit" label="Salva" :loading="saving" />
      </form>
    </Dialog>
  </div>
</template>

<style scoped>
.sbar-view {
  padding: var(--page-padding);
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.table-scroll {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  min-width: 760px;
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
