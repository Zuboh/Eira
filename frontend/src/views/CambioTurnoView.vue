<script setup lang="ts">
import { onMounted } from 'vue'
import Button from 'primevue/button'
import InlineError from '@/components/ui/InlineError.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import CambiTurnoTable from '@/features/cambi-turno/components/CambiTurnoTable.vue'
import NewCambioTurnoDialog from '@/features/cambi-turno/components/NewCambioTurnoDialog.vue'
import RifiutoCambioTurnoDialog from '@/features/cambi-turno/components/RifiutoCambioTurnoDialog.vue'
import { useCambiTurno } from '@/features/cambi-turno/useCambiTurno'

const {
  richieste,
  assegnazioni,
  loading,
  error,
  dialogOpen,
  saving,
  form,
  colleghi,
  currentRole,
  currentUserId,
  canRequestChange,
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
        <Button v-if="canRequestChange" label="Richiedi cambio" size="small" @click="apriNuova" />
      </template>
    </PageHeader>

    <InlineError :message="error" />

    <CambiTurnoTable
      v-if="!loading"
      :richieste="richieste"
      :current-user-id="currentUserId"
      :current-role="currentRole"
      :nome-utente="nomeUtente"
      @colleague-response="rispondiComeCollega"
      @approve="approvaCaposala"
      @reject="apriRifiuto"
    />

    <NewCambioTurnoDialog
      v-model:visible="dialogOpen"
      v-model:form="form"
      :assegnazioni="assegnazioni"
      :colleghi="colleghi"
      :saving="saving"
      @save="salva"
    />

    <RifiutoCambioTurnoDialog v-model:visible="rifiutoDialog" v-model:motivo="motivoRifiuto" @save="confermaRifiuto" />
  </div>
</template>

<style scoped>
.cambio-view {
  padding: var(--page-padding);
  max-width: 1200px;
  margin: 0 auto;
}
</style>
