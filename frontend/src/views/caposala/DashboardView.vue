<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
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
import TurniScopertiCard from '@/features/dashboard/components/TurniScopertiCard.vue'
import { TIPO_TURNO_LABEL } from '@/features/turni/constants'
import { useCaposalaDashboard } from '@/features/dashboard/useCaposalaDashboard'
import { formatDateShortIt } from '@/utils/dateFormat'

const {
  pendingCount,
  dashboard,
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
  apriAssegna,
  confermaAssegna,
} = useCaposalaDashboard()

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

    <TurniScopertiCard
      :turni="dashboard?.turni_scoperti ?? []"
      :loading="loading || !dashboard"
      @assign="apriAssegna"
    />

    <CambiTurnoCard
      :richieste="richiesteCambioTurno"
      :loading="loading"
      :nome-utente="nomeUtenteCambioTurno"
      @approve="approvaCambioTurnoCaposala"
      @reject="apriRifiutoCambioTurno"
    />

    <CalendarioTurniCard :rows="righeCalendario" :loading="loading" />

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
