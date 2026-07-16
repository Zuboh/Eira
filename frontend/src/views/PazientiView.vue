<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import DatePicker from 'primevue/datepicker'
import { useAuthStore } from '@/stores/auth'
import StatusBadge from '@/components/StatusBadge.vue'
import EiraTable from '@/components/ui/EiraTable.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import FormField from '@/components/ui/FormField.vue'
import InlineError from '@/components/ui/InlineError.vue'
import { dialogStyle } from '@/components/ui/dialogStyles'
import PageHeader from '@/components/ui/PageHeader.vue'
import { listPazienti, createPaziente, type Paziente } from '@/api/pazienti'

const auth = useAuthStore()

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
    <PageHeader title="Pazienti" subtitle="Elenco dei pazienti visibili per reparto e ruolo.">
      <template v-if="auth.ruolo === 'caposala'" #actions>
        <Button label="Nuovo paziente" size="small" @click="apriNuovo" />
      </template>
    </PageHeader>

    <InlineError :message="error" />

    <EiraTable v-if="!loading && pazienti.length > 0">
      <table class="pazienti-table">
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
          <tr v-for="p in pazienti" :key="p.id" class="row">
            <td>
              <RouterLink class="patient-link" :to="{ name: 'paziente-scheda', params: { id: p.id } }">
                {{ p.cognome }}
              </RouterLink>
            </td>
            <td>{{ p.nome }}</td>
            <td class="mono">{{ p.eta }}</td>
            <td class="mono">{{ p.letto }}</td>
            <td>{{ p.diagnosi_ingresso }}</td>
            <td class="mono">{{ p.data_ricovero }}</td>
            <td><StatusBadge :status="p.dimesso ? 'dimesso' : 'attivo'" :label="p.dimesso ? 'Dimesso' : 'Attivo'" /></td>
          </tr>
        </tbody>
      </table>
    </EiraTable>

    <EmptyState
      v-if="!loading && pazienti.length === 0 && auth.ruolo === 'infermiere'"
      title="Nessun paziente visibile"
      message="Nessun turno attivo assegnato: nessun paziente visibile."
    />
    <EmptyState
      v-else-if="!loading && pazienti.length === 0"
      title="Nessun paziente in reparto"
      message="Quando saranno creati pazienti attivi, appariranno in questa lista."
    />

    <Dialog v-model:visible="dialogOpen" header="Nuovo paziente" modal :style="dialogStyle.md">
      <form class="form" @submit.prevent="salva">
        <FormField label="Nome" forId="paziente-nome" required>
          <InputText id="paziente-nome" v-model="form.nome" required />
        </FormField>
        <FormField label="Cognome" forId="paziente-cognome" required>
          <InputText id="paziente-cognome" v-model="form.cognome" required />
        </FormField>
        <FormField label="Età" forId="paziente-eta" required>
          <InputNumber inputId="paziente-eta" v-model="form.eta" :min="0" :max="120" required />
        </FormField>
        <FormField label="Letto" forId="paziente-letto" required>
          <InputText id="paziente-letto" v-model="form.letto" required />
        </FormField>
        <FormField label="Data ricovero" forId="paziente-data-ricovero" required>
          <DatePicker inputId="paziente-data-ricovero" v-model="form.data_ricovero" dateFormat="yy-mm-dd" required />
        </FormField>
        <FormField label="Diagnosi ingresso" forId="paziente-diagnosi" required>
          <InputText id="paziente-diagnosi" v-model="form.diagnosi_ingresso" required />
        </FormField>
        <Button type="submit" label="Crea" :loading="saving" />
      </form>
    </Dialog>
  </div>
</template>

<style scoped>
.pazienti-view {
  padding: var(--page-padding);
  max-width: 1200px;
  margin: 0 auto;
}

.pazienti-table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
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
  transition: background 150ms ease-out;
}

.row:hover {
  background: var(--canvas);
}

.patient-link {
  color: inherit;
  font-weight: 600;
  text-decoration: none;
}

.patient-link:hover {
  color: var(--color-primary);
  text-decoration: underline;
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

</style>
