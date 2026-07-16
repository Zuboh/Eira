<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import StatusBadge from '@/components/StatusBadge.vue'
import EiraCard from '@/components/ui/EiraCard.vue'
import EiraTable from '@/components/ui/EiraTable.vue'
import InlineError from '@/components/ui/InlineError.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { getMieAssegnazioni, listTurni, type Turno, type AssegnazioneTurno } from '@/api/turni'
import { listConsegneSbar, type ConsegnaSbar } from '@/api/consegneSbar'
import { listPazienti, type Paziente } from '@/api/pazienti'

const TIPO_LABEL: Record<Turno['tipo'], string> = {
  mattina: 'Mattina',
  pomeriggio: 'Pomeriggio',
  notte: 'Notte',
}

const assegnazioni = ref<AssegnazioneTurno[]>([])
const turni = ref<Turno[]>([])
const consegne = ref<ConsegnaSbar[]>([])
const pazienti = ref<Paziente[]>([])
const loading = ref(false)
const error = ref('')

function formatData(data: string) {
  return new Date(`${data}T00:00:00`).toLocaleDateString('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

const oggi = new Date().toISOString().slice(0, 10)

const turniById = computed(() => new Map(turni.value.map((t) => [t.id, t])))
const pazientiById = computed(() => new Map(pazienti.value.map((p) => [p.id, p])))

function nomePaziente(id: number) {
  const p = pazientiById.value.get(id)
  return p ? `${p.cognome} ${p.nome}` : `#${id}`
}

const mieiTurni = computed(() => {
  return assegnazioni.value
    .filter((a) => a.stato === 'attiva')
    .map((a) => turniById.value.get(a.turno_id))
    .filter((t): t is Turno => t !== undefined && t.data >= oggi)
    .sort((a, b) => a.data.localeCompare(b.data))
})

const consegneRecenti = computed(() => consegne.value)

const pazientiAttivi = computed(() => pazienti.value)

async function load() {
  error.value = ''
  loading.value = true
  try {
    const [a, t, c, p] = await Promise.all([
      getMieAssegnazioni(),
      listTurni(),
      listConsegneSbar(),
      listPazienti(),
    ])
    assegnazioni.value = a.data
    turni.value = t.data
    consegne.value = c.data.slice(0, 5)
    pazienti.value = p.data.filter((paziente) => !paziente.dimesso)
  } catch {
    error.value = 'Impossibile caricare la dashboard.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="dashboard-infermiere">
    <PageHeader title="Dashboard Infermiere" />

    <InlineError :message="error" />

    <div class="quick-links">
      <RouterLink :to="{ name: 'pazienti' }" class="quick-link">Pazienti</RouterLink>
      <RouterLink :to="{ name: 'consegne-sbar' }" class="quick-link">Consegne SBAR</RouterLink>
      <RouterLink :to="{ name: 'cambio-turno' }" class="quick-link">Cambio turno</RouterLink>
      <RouterLink :to="{ name: 'banca-ore' }" class="quick-link">Banca ore</RouterLink>
    </div>

    <EiraCard title="Prossimi turni" class="dashboard-card">
      <EiraTable v-if="!loading" :empty="mieiTurni.length === 0" empty-message="Nessun turno assegnato.">
        <table>
          <thead>
            <tr><th>Data</th><th>Turno</th><th>Orario</th></tr>
          </thead>
          <tbody>
            <tr v-for="t in mieiTurni" :key="t.id">
              <td>{{ formatData(t.data) }}</td>
              <td>{{ TIPO_LABEL[t.tipo] }}</td>
              <td class="mono">{{ t.ora_inizio.slice(0, 5) }}–{{ t.ora_fine.slice(0, 5) }}</td>
            </tr>
          </tbody>
        </table>
      </EiraTable>
    </EiraCard>

    <EiraCard class="dashboard-card">
      <div class="section-header">
        <h2>Consegne SBAR recenti</h2>
        <RouterLink :to="{ name: 'consegne-sbar' }" class="see-all">Vedi tutte</RouterLink>
      </div>
      <EiraTable v-if="!loading" :empty="consegneRecenti.length === 0" empty-message="Nessuna consegna registrata.">
        <table>
          <thead>
            <tr><th>Paziente</th><th>Priorità</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="c in consegneRecenti" :key="c.id">
              <td>
                <RouterLink :to="{ name: 'paziente-scheda', params: { id: c.paziente_id } }">
                  {{ nomePaziente(c.paziente_id) }}
                </RouterLink>
              </td>
              <td><StatusBadge :status="c.priorita" /></td>
              <td class="mono">{{ new Date(c.creata_il).toLocaleDateString('it-IT') }}</td>
            </tr>
          </tbody>
        </table>
      </EiraTable>
    </EiraCard>

    <EiraCard class="dashboard-card">
      <div class="section-header">
        <h2>I miei pazienti</h2>
        <RouterLink :to="{ name: 'pazienti' }" class="see-all">Vedi tutti</RouterLink>
      </div>
      <EiraTable v-if="!loading" :empty="pazientiAttivi.length === 0" empty-message="Nessun paziente in carico.">
        <table>
          <thead>
            <tr><th>Paziente</th><th>Letto</th><th>Diagnosi</th></tr>
          </thead>
          <tbody>
            <tr v-for="p in pazientiAttivi" :key="p.id">
              <td>
                <RouterLink :to="{ name: 'paziente-scheda', params: { id: p.id } }">
                  {{ p.cognome }} {{ p.nome }}
                </RouterLink>
              </td>
              <td class="mono">{{ p.letto }}</td>
              <td>{{ p.diagnosi_ingresso }}</td>
            </tr>
          </tbody>
        </table>
      </EiraTable>
    </EiraCard>
  </div>
</template>

<style scoped>
.dashboard-infermiere {
  padding: var(--page-padding);
  max-width: var(--page-xl);
  margin: 0 auto;
}

.quick-links {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.quick-link {
  padding: 8px 16px;
  min-height: var(--size-touch);
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: inherit;
  text-decoration: none;
  font-size: 0.9375rem;
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

.dashboard-card :deep(td a) {
  color: inherit;
  font-weight: 600;
  text-decoration: none;
}
</style>
