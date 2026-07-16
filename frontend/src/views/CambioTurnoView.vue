<script setup lang="ts">
import { onMounted } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import { useAuthStore } from '@/stores/auth'
import { dialogStyle } from '@/components/ui/dialogStyles'
import EiraTable from '@/components/ui/EiraTable.vue'
import FormField from '@/components/ui/FormField.vue'
import InlineError from '@/components/ui/InlineError.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useCambiTurno } from '@/features/cambi-turno/useCambiTurno'

const auth = useAuthStore()
const {
  richieste,
  assegnazioni,
  loading,
  error,
  dialogOpen,
  saving,
  form,
  colleghi,
  rifiutoDialog,
  motivoRifiuto,
  nomeUtente,
  load,
  apriNuova,
  salva,
  rispondiComeCollega,
  apriRifiuto,
  approvaCaposala,
  confermaRifiuto,
} = useCambiTurno()

onMounted(load)
</script>

<template>
  <div class="cambio-view">
    <PageHeader title="Cambio Turno">
      <template #actions>
      <Button v-if="auth.ruolo === 'infermiere'" label="Richiedi cambio" size="small" @click="apriNuova" />
      </template>
    </PageHeader>

    <InlineError :message="error" />

    <EiraTable v-if="!loading" :empty="richieste.length === 0" empty-message="Nessuna richiesta di cambio turno.">
      <table>
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
    </EiraTable>

    <Dialog v-model:visible="dialogOpen" header="Richiedi cambio turno" modal :style="dialogStyle.sm">
      <form class="form" @submit.prevent="salva">
        <FormField label="Tuo turno" required>
          <Select v-model="form.assegnazione_turno_id" :options="assegnazioni" optionLabel="turno_id" optionValue="id" placeholder="Seleziona assegnazione" required />
        </FormField>
        <FormField label="Collega" required>
          <Select v-model="form.collega_id" :options="colleghi" optionLabel="cognome" optionValue="id" placeholder="Seleziona collega" required />
        </FormField>
        <Button type="submit" label="Invia richiesta" :loading="saving" />
      </form>
    </Dialog>

    <Dialog v-model:visible="rifiutoDialog" header="Motivo rifiuto" modal :style="dialogStyle.sm">
      <form class="form" @submit.prevent="confermaRifiuto">
        <FormField label="Motivo">
          <InputText v-model="motivoRifiuto" />
        </FormField>
        <Button type="submit" label="Conferma rifiuto" severity="secondary" />
      </form>
    </Dialog>
  </div>
</template>

<style scoped>
.cambio-view {
  padding: var(--page-padding);
  max-width: 1200px;
  margin: 0 auto;
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
</style>
