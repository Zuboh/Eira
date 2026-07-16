<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import { useAuthStore } from '@/stores/auth'
import StatusBadge from '@/components/StatusBadge.vue'
import { getPaziente, updatePaziente, type Paziente } from '@/api/pazienti'
import { getMieAssegnazioni, type AssegnazioneTurno } from '@/api/turni'
import {
  listDiarioCedema,
  createVoceDiarioCedema,
  type VoceDiarioCedema,
} from '@/api/diarioCedema'
import {
  getValutazioni,
  createNorton,
  createConley,
  type ValutazioneNorton,
  type ValutazioneConley,
} from '@/api/valutazioni'
import { listConsegneSbar, type ConsegnaSbar } from '@/api/consegneSbar'

const route = useRoute()
const auth = useAuthStore()
const pazienteId = computed(() => Number(route.params.id))

const paziente = ref<Paziente | null>(null)
const error = ref('')
const loading = ref(false)

const cedema = ref<VoceDiarioCedema[]>([])
const norton = ref<ValutazioneNorton[]>([])
const conley = ref<ValutazioneConley[]>([])
const consegne = ref<ConsegnaSbar[]>([])
const assegnazioni = ref<AssegnazioneTurno[]>([])

async function load() {
  error.value = ''
  loading.value = true
  try {
    const [p, d, v, s] = await Promise.all([
      getPaziente(pazienteId.value),
      listDiarioCedema(pazienteId.value),
      getValutazioni(pazienteId.value),
      listConsegneSbar(),
    ])
    paziente.value = p.data
    cedema.value = d.data
    norton.value = v.data.norton
    conley.value = v.data.conley
    consegne.value = s.data.filter((c) => c.paziente_id === pazienteId.value)
    if (auth.ruolo === 'infermiere') {
      const a = await getMieAssegnazioni()
      assegnazioni.value = a.data
    }
  } catch {
    error.value = 'Impossibile caricare la scheda paziente.'
  } finally {
    loading.value = false
  }
}

// --- edit inline (caposala) ---
const editing = ref(false)
const editForm = ref({ letto: '', diagnosi_ingresso: '', dimesso: false })

function apriEdit() {
  if (!paziente.value) return
  editForm.value = {
    letto: paziente.value.letto,
    diagnosi_ingresso: paziente.value.diagnosi_ingresso,
    dimesso: paziente.value.dimesso,
  }
  editing.value = true
}

async function salvaEdit() {
  const { data } = await updatePaziente(pazienteId.value, editForm.value)
  paziente.value = data
  editing.value = false
}

// --- CEDEMA form (infermiere) ---
const cedemaDialog = ref(false)
const cedemaSaving = ref(false)
const cedemaForm = ref({
  turno_id: null as number | null,
  coscienza: '',
  emotivita: '',
  dolore: '',
  emodinamica: '',
  mobilizzazione: '',
  allert: '',
})

function apriCedema() {
  cedemaForm.value = {
    turno_id: null,
    coscienza: '',
    emotivita: '',
    dolore: '',
    emodinamica: '',
    mobilizzazione: '',
    allert: '',
  }
  cedemaDialog.value = true
}

async function salvaCedema() {
  cedemaSaving.value = true
  try {
    await createVoceDiarioCedema(pazienteId.value, cedemaForm.value)
    cedemaDialog.value = false
    const { data } = await listDiarioCedema(pazienteId.value)
    cedema.value = data
  } catch {
    error.value = 'Impossibile salvare la voce diario.'
  } finally {
    cedemaSaving.value = false
  }
}

// --- Norton form ---
const nortonDialog = ref(false)
const nortonSaving = ref(false)
const nortonForm = ref({
  data_valutazione: new Date().toISOString().slice(0, 10),
  condizioni_generali: 1,
  stato_mentale: 1,
  attivita: 1,
  mobilita: 1,
  incontinenza: 1,
})

function apriNorton() {
  nortonForm.value = {
    data_valutazione: new Date().toISOString().slice(0, 10),
    condizioni_generali: 1,
    stato_mentale: 1,
    attivita: 1,
    mobilita: 1,
    incontinenza: 1,
  }
  nortonDialog.value = true
}

async function salvaNorton() {
  nortonSaving.value = true
  try {
    await createNorton(pazienteId.value, nortonForm.value)
    nortonDialog.value = false
    const { data } = await getValutazioni(pazienteId.value)
    norton.value = data.norton
  } catch {
    error.value = 'Impossibile salvare la valutazione Norton.'
  } finally {
    nortonSaving.value = false
  }
}

// --- Conley form ---
const conleyDialog = ref(false)
const conleySaving = ref(false)
const conleyForm = ref({
  data_valutazione: new Date().toISOString().slice(0, 10),
  storia_cadute: 0,
  deficit_visivo: 0,
  alterazione_eliminazione: 0,
  agitazione: 0,
  deficit_vista_osservato: 0,
  andatura_alterata: 0,
})

function apriConley() {
  conleyForm.value = {
    data_valutazione: new Date().toISOString().slice(0, 10),
    storia_cadute: 0,
    deficit_visivo: 0,
    alterazione_eliminazione: 0,
    agitazione: 0,
    deficit_vista_osservato: 0,
    andatura_alterata: 0,
  }
  conleyDialog.value = true
}

async function salvaConley() {
  conleySaving.value = true
  try {
    await createConley(pazienteId.value, conleyForm.value)
    conleyDialog.value = false
    const { data } = await getValutazioni(pazienteId.value)
    conley.value = data.conley
  } catch {
    error.value = 'Impossibile salvare la valutazione Conley.'
  } finally {
    conleySaving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="scheda-view">
    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <template v-if="paziente">
      <div class="header">
        <div>
          <h1>{{ paziente.cognome }} {{ paziente.nome }}</h1>
          <p class="sub mono">
            Letto {{ paziente.letto }} · {{ paziente.eta }} anni · ricovero {{ paziente.data_ricovero }}
          </p>
          <p class="diagnosi">{{ paziente.diagnosi_ingresso }}</p>
        </div>
        <div class="header-actions">
          <StatusBadge :status="paziente.dimesso ? 'dimesso' : 'attivo'" :label="paziente.dimesso ? 'Dimesso' : 'Attivo'" />
          <Button v-if="auth.ruolo === 'caposala'" label="Modifica" size="small" severity="secondary" @click="apriEdit" />
        </div>
      </div>

      <Tabs value="cedema">
        <TabList>
          <Tab value="cedema">CEDEMA</Tab>
          <Tab value="valutazioni">Valutazioni</Tab>
          <Tab value="sbar">Storico SBAR</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="cedema">
            <div class="panel-header">
              <Button v-if="auth.ruolo === 'infermiere'" label="Nuova voce" size="small" @click="apriCedema" />
            </div>
            <table v-if="cedema.length > 0" class="data-table">
              <thead>
                <tr>
                  <th>Data</th><th>Coscienza</th><th>Emotività</th><th>Dolore</th><th>Emodinamica</th><th>Mobilizzazione</th><th>Allert</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="v in cedema" :key="v.id">
                  <td class="mono">{{ v.timestamp.slice(0, 16).replace('T', ' ') }}</td>
                  <td>{{ v.coscienza }}</td>
                  <td>{{ v.emotivita }}</td>
                  <td>{{ v.dolore }}</td>
                  <td>{{ v.emodinamica }}</td>
                  <td>{{ v.mobilizzazione }}</td>
                  <td>{{ v.allert }}</td>
                </tr>
              </tbody>
            </table>
            <p v-else class="hint">Nessuna voce diario CEDEMA.</p>
          </TabPanel>

          <TabPanel value="valutazioni">
            <div class="panel-header">
              <Button v-if="auth.ruolo === 'infermiere'" label="Nuova Norton" size="small" @click="apriNorton" />
              <Button v-if="auth.ruolo === 'infermiere'" label="Nuova Conley" size="small" severity="secondary" @click="apriConley" />
            </div>
            <h2>Norton</h2>
            <table v-if="norton.length > 0" class="data-table">
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
            <p v-else class="hint">Nessuna valutazione Norton.</p>

            <h2>Conley</h2>
            <table v-if="conley.length > 0" class="data-table">
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
            <p v-else class="hint">Nessuna valutazione Conley.</p>
          </TabPanel>

          <TabPanel value="sbar">
            <table v-if="consegne.length > 0" class="data-table">
              <thead>
                <tr><th>Data</th><th>Priorità</th><th>Situation</th><th>Background</th><th>Assessment</th><th>Recommendation</th></tr>
              </thead>
              <tbody>
                <tr v-for="c in consegne" :key="c.id">
                  <td class="mono">{{ c.creata_il.slice(0, 16).replace('T', ' ') }}</td>
                  <td><StatusBadge :status="c.priorita" /></td>
                  <td>{{ c.situation }}</td>
                  <td>{{ c.background }}</td>
                  <td>{{ c.assessment }}</td>
                  <td>{{ c.recommendation }}</td>
                </tr>
              </tbody>
            </table>
            <p v-else class="hint">Nessuna consegna SBAR per questo paziente.</p>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </template>

    <Dialog v-model:visible="editing" header="Modifica paziente" modal :style="{ width: '24rem' }">
      <form class="form" @submit.prevent="salvaEdit">
        <label>Letto<InputText v-model="editForm.letto" required /></label>
        <label>Diagnosi ingresso<InputText v-model="editForm.diagnosi_ingresso" required /></label>
        <label class="checkbox">
          <input type="checkbox" v-model="editForm.dimesso" /> Dimesso
        </label>
        <Button type="submit" label="Salva" />
      </form>
    </Dialog>

    <Dialog v-model:visible="cedemaDialog" header="Nuova voce CEDEMA" modal :style="{ width: '28rem' }">
      <form class="form" @submit.prevent="salvaCedema">
        <label v-if="assegnazioni.length > 0">
          Turno (opzionale)
          <Select v-model="cedemaForm.turno_id" :options="assegnazioni" optionLabel="turno_id" optionValue="turno_id" showClear placeholder="Nessuno" />
        </label>
        <label>Coscienza<Textarea v-model="cedemaForm.coscienza" rows="2" required /></label>
        <label>Emotività<Textarea v-model="cedemaForm.emotivita" rows="2" required /></label>
        <label>Dolore<Textarea v-model="cedemaForm.dolore" rows="2" required /></label>
        <label>Emodinamica<Textarea v-model="cedemaForm.emodinamica" rows="2" required /></label>
        <label>Mobilizzazione<Textarea v-model="cedemaForm.mobilizzazione" rows="2" required /></label>
        <label>Allert<Textarea v-model="cedemaForm.allert" rows="2" required /></label>
        <Button type="submit" label="Salva" :loading="cedemaSaving" />
      </form>
    </Dialog>

    <Dialog v-model:visible="nortonDialog" header="Nuova valutazione Norton" modal :style="{ width: '24rem' }">
      <form class="form" @submit.prevent="salvaNorton">
        <label>Data<InputText v-model="nortonForm.data_valutazione" type="date" required /></label>
        <label>Condizioni generali (1-4)<InputNumber v-model="nortonForm.condizioni_generali" :min="1" :max="4" /></label>
        <label>Stato mentale (1-4)<InputNumber v-model="nortonForm.stato_mentale" :min="1" :max="4" /></label>
        <label>Attività (1-4)<InputNumber v-model="nortonForm.attivita" :min="1" :max="4" /></label>
        <label>Mobilità (1-4)<InputNumber v-model="nortonForm.mobilita" :min="1" :max="4" /></label>
        <label>Incontinenza (1-4)<InputNumber v-model="nortonForm.incontinenza" :min="1" :max="4" /></label>
        <Button type="submit" label="Salva" :loading="nortonSaving" />
      </form>
    </Dialog>

    <Dialog v-model:visible="conleyDialog" header="Nuova valutazione Conley" modal :style="{ width: '24rem' }">
      <form class="form" @submit.prevent="salvaConley">
        <label>Data<InputText v-model="conleyForm.data_valutazione" type="date" required /></label>
        <label>Storia cadute<InputNumber v-model="conleyForm.storia_cadute" :min="0" /></label>
        <label>Deficit visivo<InputNumber v-model="conleyForm.deficit_visivo" :min="0" /></label>
        <label>Alterazione eliminazione<InputNumber v-model="conleyForm.alterazione_eliminazione" :min="0" /></label>
        <label>Agitazione<InputNumber v-model="conleyForm.agitazione" :min="0" /></label>
        <label>Deficit vista osservato<InputNumber v-model="conleyForm.deficit_vista_osservato" :min="0" /></label>
        <label>Andatura alterata<InputNumber v-model="conleyForm.andatura_alterata" :min="0" /></label>
        <Button type="submit" label="Salva" :loading="conleySaving" />
      </form>
    </Dialog>
  </div>
</template>

<style scoped>
.scheda-view {
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sub {
  color: var(--steel);
  font-size: 0.8125rem;
  margin: 4px 0;
}

.diagnosi {
  color: var(--ink);
  font-size: 0.9375rem;
}

.panel-header {
  display: flex;
  gap: 8px;
  margin: 12px 0;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
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

.form label.checkbox {
  flex-direction: row;
  align-items: center;
  gap: 8px;
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
