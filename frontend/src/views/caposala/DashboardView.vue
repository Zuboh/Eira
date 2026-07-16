<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import { dialogStyle } from '@/components/ui/dialogStyles'
import StatusBadge from '@/components/StatusBadge.vue'
import { listUtenti, type Utente } from '@/api/utenti'
import { getDashboardCaposala, type DashboardCaposala } from '@/api/dashboard'
import { getCalendarioTurni, assegnaTurno, type Turno, type TurnoCalendario } from '@/api/turni'
import { useCambiTurno } from '@/features/cambi-turno/useCambiTurno'

const TIPO_LABEL: Record<Turno['tipo'], string> = {
  mattina: 'Mattina',
  pomeriggio: 'Pomeriggio',
  notte: 'Notte',
}
const TIPI: Turno['tipo'][] = ['mattina', 'pomeriggio', 'notte']

type CalendarioCella = {
  tipo: Turno['tipo']
  turno: TurnoCalendario | null
  assegnati: string
}

type CalendarioRiga = {
  data: string
  celle: CalendarioCella[]
}

const pendingCount = ref(0)
const utenti = ref<Utente[]>([])
const dashboard = ref<DashboardCaposala | null>(null)
const calendario = ref<TurnoCalendario[]>([])
const loading = ref(false)
const error = ref('')

function formatData(data: string) {
  return new Date(`${data}T00:00:00`).toLocaleDateString('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

const infermieri = computed(() => utenti.value.filter((u) => u.ruolo === 'infermiere'))

const righeCalendario = computed<CalendarioRiga[]>(() => {
  const turniByData = new Map<string, Partial<Record<Turno['tipo'], TurnoCalendario>>>()

  for (const turno of calendario.value) {
    const turni = turniByData.get(turno.data) ?? {}
    turni[turno.tipo] = turno
    turniByData.set(turno.data, turni)
  }

  return [...turniByData.entries()]
    .sort(([dataA], [dataB]) => dataA.localeCompare(dataB))
    .map(([data, turni]) => ({
      data,
      celle: TIPI.map((tipo) => {
        const turno = turni[tipo] ?? null

        return {
          tipo,
          turno,
          assegnati: turno ? turno.assegnazioni.map((a) => nomeUtenteCambioTurno(a.infermiere_id)).join(', ') : '',
        }
      }),
    }))
})

async function load() {
  error.value = ''
  loading.value = true
  try {
    const [u, d, c] = await Promise.all([listUtenti(), getDashboardCaposala(), getCalendarioTurni()])
    utenti.value = u.data
    dashboard.value = d.data
    setRichiesteCambioTurno(d.data.cambi_turno_in_attesa)
    setUtentiCambioTurno(u.data)
    calendario.value = c.data
    pendingCount.value = u.data.filter((x) => x.stato === 'in_attesa').length
  } catch {
    error.value = 'Impossibile caricare la dashboard.'
  } finally {
    loading.value = false
  }
}

const assegnaDialog = ref(false)
const assegnaTarget = ref<Turno | null>(null)
const assegnaInfermiereId = ref<number | null>(null)
const saving = ref(false)

function apriAssegna(turno: Turno) {
  assegnaTarget.value = turno
  assegnaInfermiereId.value = null
  assegnaDialog.value = true
}

async function confermaAssegna() {
  if (!assegnaTarget.value || !assegnaInfermiereId.value) return
  saving.value = true
  error.value = ''
  try {
    await assegnaTurno(assegnaTarget.value.id, assegnaInfermiereId.value)
    assegnaDialog.value = false
    await load()
  } catch {
    error.value = 'Impossibile assegnare il turno.'
  } finally {
    saving.value = false
  }
}

const {
  richieste: richiesteCambioTurno,
  error: cambioTurnoError,
  rifiutoDialog: cambioTurnoRifiutoDialog,
  motivoRifiuto: cambioTurnoMotivoRifiuto,
  setRichieste: setRichiesteCambioTurno,
  setUtenti: setUtentiCambioTurno,
  nomeUtente: nomeUtenteCambioTurno,
  apriRifiuto: apriRifiutoCambioTurno,
  approvaCaposala: approvaCambioTurnoCaposala,
  confermaRifiuto: confermaRifiutoCambioTurno,
} = useCambiTurno({ refreshAfterMutation: load })

onMounted(load)
</script>

<template>
  <div class="dashboard-caposala">
    <div class="header">
      <h1>Dashboard Caposala</h1>
      <RouterLink :to="{ name: 'caposala-staff' }" class="staff-link">
        Personale
        <span v-if="pendingCount > 0" class="badge">{{ pendingCount }}</span>
      </RouterLink>
    </div>

    <p v-if="error || cambioTurnoError" class="error" role="alert">{{ error || cambioTurnoError }}</p>

    <section class="card">
      <h2>Turni scoperti</h2>
      <table v-if="!loading && dashboard && dashboard.turni_scoperti.length > 0" class="data-table">
        <thead>
          <tr><th>Data</th><th>Turno</th><th>Orario</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="t in dashboard.turni_scoperti" :key="t.id">
            <td>{{ formatData(t.data) }}</td>
            <td>{{ TIPO_LABEL[t.tipo] }}</td>
            <td class="mono">{{ t.ora_inizio.slice(0, 5) }}–{{ t.ora_fine.slice(0, 5) }}</td>
            <td class="actions"><Button label="Assegna" size="small" @click="apriAssegna(t)" /></td>
          </tr>
        </tbody>
      </table>
      <p v-else-if="!loading" class="hint">Nessun turno scoperto.</p>
    </section>

    <section class="card">
      <div class="section-header">
        <h2>Cambi turno in attesa</h2>
        <RouterLink :to="{ name: 'cambio-turno' }" class="see-all">Vedi tutti</RouterLink>
      </div>
      <table v-if="!loading && richiesteCambioTurno.length > 0" class="data-table">
        <thead>
          <tr><th>Richiedente</th><th>Collega</th><th>Stato</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="r in richiesteCambioTurno" :key="r.id">
            <td>{{ nomeUtenteCambioTurno(r.richiedente_id) }}</td>
            <td>{{ nomeUtenteCambioTurno(r.collega_id) }}</td>
            <td><StatusBadge :status="r.stato" /></td>
            <td class="actions">
              <template v-if="r.stato === 'in_attesa_caposala'">
                <Button label="Approva" size="small" @click="approvaCambioTurnoCaposala(r)" />
                <Button label="Rifiuta" size="small" severity="secondary" @click="apriRifiutoCambioTurno(r)" />
              </template>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else-if="!loading" class="hint">Nessun cambio turno in attesa.</p>
    </section>

    <section class="card">
      <h2>Calendario turni</h2>
      <div v-if="!loading && righeCalendario.length > 0" class="calendario-scroll">
        <table class="calendario">
          <thead>
            <tr>
              <th></th>
              <th v-for="tipo in TIPI" :key="tipo">{{ TIPO_LABEL[tipo] }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="riga in righeCalendario" :key="riga.data">
              <th class="row-label">{{ formatData(riga.data) }}</th>
              <td v-for="cella in riga.celle" :key="cella.tipo">
                <template v-if="cella.turno">
                  <span v-if="cella.turno.assegnazioni.length > 0" class="assegnati">
                    {{ cella.assegnati }}
                  </span>
                  <span v-else class="scoperto">Scoperto</span>
                </template>
                <span v-else class="assente">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else-if="!loading" class="hint">Nessun turno pianificato.</p>
    </section>

    <Dialog v-model:visible="assegnaDialog" header="Assegna turno" modal :style="dialogStyle.sm">
      <form class="form" @submit.prevent="confermaAssegna">
        <p v-if="assegnaTarget" class="hint">
          {{ formatData(assegnaTarget.data) }} · {{ TIPO_LABEL[assegnaTarget.tipo] }}
        </p>
        <label>
          Infermiere
          <Select
            v-model="assegnaInfermiereId"
            :options="infermieri"
            optionLabel="cognome"
            optionValue="id"
            placeholder="Seleziona infermiere"
            required
          />
        </label>
        <Button type="submit" label="Assegna" :loading="saving" />
      </form>
    </Dialog>

    <Dialog v-model:visible="cambioTurnoRifiutoDialog" header="Motivo rifiuto" modal :style="dialogStyle.sm">
      <form class="form" @submit.prevent="confermaRifiutoCambioTurno">
        <label>Motivo<InputText v-model="cambioTurnoMotivoRifiuto" /></label>
        <Button type="submit" label="Conferma rifiuto" severity="secondary" />
      </form>
    </Dialog>
  </div>
</template>

<style scoped>
.dashboard-caposala {
  padding: var(--page-padding);
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.staff-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  min-height: var(--size-touch);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: inherit;
  text-decoration: none;
  font-size: 0.9375rem;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--state-urgente);
  color: var(--color-on-danger);
  font-size: 0.75rem;
  font-weight: 700;
}

.card {
  margin-top: 24px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}

.card h2 {
  margin: 0;
  font-size: 1.0625rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.see-all {
  color: var(--steel);
  font-size: 0.8125rem;
  font-weight: 600;
  text-decoration: none;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
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

.calendario-scroll {
  overflow-x: auto;
  margin-top: 12px;
}

.calendario {
  width: 100%;
  border-collapse: collapse;
  min-width: 480px;
}

.calendario th,
.calendario td {
  padding: 8px 12px;
  border: 1px solid var(--border);
  font-size: 0.8125rem;
  text-align: left;
  white-space: nowrap;
}

.calendario thead th {
  color: var(--steel);
  font-weight: 600;
}

.row-label {
  color: var(--steel);
  font-weight: 600;
}

.scoperto {
  color: var(--state-urgente);
  font-weight: 600;
}

.assente {
  color: var(--steel);
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
}
</style>
