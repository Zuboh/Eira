<script setup lang="ts">
import { onMounted } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import { dialogStyle } from '@/components/ui/dialogStyles'
import FormField from '@/components/ui/FormField.vue'
import InlineError from '@/components/ui/InlineError.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import CambiTurnoCard from '@/features/dashboard/components/CambiTurnoCard.vue'
import CalendarioTurniCard from '@/features/dashboard/components/CalendarioTurniCard.vue'
import TriageLedgerCard from '@/features/dashboard/components/TriageLedgerCard.vue'
import TurniScopertiCard from '@/features/dashboard/components/TurniScopertiCard.vue'
import { TIPO_TURNO_LABEL } from '@/features/turni/constants'
import { useCaposalaDashboard } from '@/features/dashboard/useCaposalaDashboard'
import { useAuthStore } from '@/stores/auth'
import { formatDateShortIt } from '@/utils/dateFormat'

const auth = useAuthStore()

const {
  pendingCount,
  dashboard,
  turniScopertiGiorni,
  turniScopertiSetteGiorniCount,
  cambiDaApprovareCount,
  calendarioDa,
  calendarioA,
  puoAndareSettimanaPrecedente,
  puoAndareSettimanaSuccessiva,
  loading,
  error,
  infermieri,
  righeCalendario,
  assegnaDialog,
  assegnaTarget,
  assegnaInfermiereId,
  saving,
  richiesteCambioTurno,
  cambioTurnoError,
  cambioTurnoRifiutoDialog,
  cambioTurnoMotivoRifiuto,
  nomeUtenteCambioTurno,
  apriRifiutoCambioTurno,
  approvaCambioTurnoCaposala,
  confermaRifiutoCambioTurno,
  load,
  setTurniScopertiGiorni,
  spostaSettimanaCalendario,
  apriAssegna,
  confermaAssegna,
} = useCaposalaDashboard()

onMounted(load)
</script>

<template>
  <div class="dashboard-caposala">
    <PageHeader title="Dashboard Caposala" :reparto="auth.repartoNome" />

    <InlineError :message="error || cambioTurnoError" />

    <div class="dashboard-row dashboard-row--triage">
      <TriageLedgerCard
        :turni-scoperti-count="turniScopertiSetteGiorniCount"
        :cambi-da-approvare-count="cambiDaApprovareCount"
        :personale-in-attesa-count="pendingCount"
        :loading="loading || !dashboard"
      />

      <CambiTurnoCard
        :richieste="richiesteCambioTurno"
        :loading="loading"
        :nome-utente="nomeUtenteCambioTurno"
        @approve="approvaCambioTurnoCaposala"
        @reject="apriRifiutoCambioTurno"
      />
    </div>

    <div class="dashboard-row">
      <TurniScopertiCard
        :turni="dashboard?.turni_scoperti ?? []"
        :total="dashboard?.turni_scoperti_count ?? 0"
        :giorni="turniScopertiGiorni"
        :loading="loading || !dashboard"
        @assign="apriAssegna"
        @range-change="setTurniScopertiGiorni"
      />

      <CalendarioTurniCard
        :rows="righeCalendario"
        :da="calendarioDa"
        :a="calendarioA"
        :can-go-previous="puoAndareSettimanaPrecedente"
        :can-go-next="puoAndareSettimanaSuccessiva"
        :loading="loading"
        @previous-week="spostaSettimanaCalendario(-1)"
        @next-week="spostaSettimanaCalendario(1)"
      />
    </div>

    <Dialog
      v-model:visible="assegnaDialog"
      header="Assegna turno"
      modal
      :style="dialogStyle.sm"
    >
      <form class="form" @submit.prevent="confermaAssegna">
        <p v-if="assegnaTarget" class="hint">
          {{ formatDateShortIt(assegnaTarget.data) }} ·
          {{ TIPO_TURNO_LABEL[assegnaTarget.tipo] }}
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

    <Dialog
      v-model:visible="cambioTurnoRifiutoDialog"
      header="Motivo rifiuto"
      modal
      :style="dialogStyle.sm"
    >
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
  max-width: var(--page-2xl);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dashboard-row {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(20rem, 1fr);
  gap: 24px;
  align-items: start;
}

.dashboard-row--triage {
  grid-template-columns: minmax(20rem, 1fr) minmax(0, 2fr);
}

.dashboard-row > * {
  min-width: 0;
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

@media (max-width: 960px) {
  .dashboard-row,
  .dashboard-row--triage {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
