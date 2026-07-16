<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import { dialogStyle } from '@/components/ui/dialogStyles'
import EiraCard from '@/components/ui/EiraCard.vue'
import EiraTable from '@/components/ui/EiraTable.vue'
import FormField from '@/components/ui/FormField.vue'
import InlineError from '@/components/ui/InlineError.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
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
    <PageHeader title="Dashboard Caposala">
      <template #actions>
        <RouterLink :to="{ name: 'caposala-staff' }" class="staff-link">
          Personale
          <span v-if="pendingCount > 0" class="badge">{{ pendingCount }}</span>
        </RouterLink>
      </template>
    </PageHeader>

    <InlineError :message="error || cambioTurnoError" />

    <EiraCard title="Turni scoperti" class="dashboard-card">
      <EiraTable
        v-if="!loading && dashboard"
        :empty="dashboard.turni_scoperti.length === 0"
        empty-message="Nessun turno scoperto."
      >
        <table>
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
      </EiraTable>
    </EiraCard>

    <EiraCard class="dashboard-card">
      <div class="section-header">
        <h2>Cambi turno in attesa</h2>
        <RouterLink :to="{ name: 'cambio-turno' }" class="see-all">Vedi tutti</RouterLink>
      </div>
      <EiraTable
        v-if="!loading"
        :empty="richiesteCambioTurno.length === 0"
        empty-message="Nessun cambio turno in attesa."
      >
        <table>
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
      </EiraTable>
    </EiraCard>

    <EiraCard title="Calendario turni" class="dashboard-card">
      <EiraTable v-if="!loading" :empty="righeCalendario.length === 0" empty-message="Nessun turno pianificato.">
        <table style="min-width: 30rem">
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
      </EiraTable>
    </EiraCard>

    <Dialog v-model:visible="assegnaDialog" header="Assegna turno" modal :style="dialogStyle.sm">
      <form class="form" @submit.prevent="confermaAssegna">
        <p v-if="assegnaTarget" class="hint">
          {{ formatData(assegnaTarget.data) }} · {{ TIPO_LABEL[assegnaTarget.tipo] }}
        </p>
        <FormField label="Infermiere" required>
          <Select
            v-model="assegnaInfermiereId"
            :options="infermieri"
            optionLabel="cognome"
            optionValue="id"
            placeholder="Seleziona infermiere"
            required
          />
        </FormField>
        <Button type="submit" label="Assegna" :loading="saving" />
      </form>
    </Dialog>

    <Dialog v-model:visible="cambioTurnoRifiutoDialog" header="Motivo rifiuto" modal :style="dialogStyle.sm">
      <form class="form" @submit.prevent="confermaRifiutoCambioTurno">
        <FormField label="Motivo">
          <InputText v-model="cambioTurnoMotivoRifiuto" />
        </FormField>
        <Button type="submit" label="Conferma rifiuto" severity="secondary" />
      </form>
    </Dialog>
  </div>
</template>

<style scoped>
.dashboard-caposala {
  padding: var(--page-padding);
  max-width: var(--page-xl);
  margin: 0 auto;
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

.dashboard-card {
  margin-top: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.section-header h2 {
  margin: 0;
  font-size: 1.0625rem;
}

.see-all {
  color: var(--steel);
  font-size: 0.8125rem;
  font-weight: 600;
  text-decoration: none;
}

.actions {
  display: flex;
  gap: 8px;
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

.hint {
  color: var(--steel);
  font-size: 0.875rem;
}
</style>
