<script setup lang="ts">
import { onMounted } from 'vue'
import Button from 'primevue/button'
import EmptyState from '@/components/ui/EmptyState.vue'
import InlineError from '@/components/ui/InlineError.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import NewPatientDialog from '@/features/patients/components/NewPatientDialog.vue'
import PatientsTable from '@/features/patients/components/PatientsTable.vue'
import { usePatients } from '@/features/patients/usePatients'

const {
  pazienti,
  loading,
  error,
  dialogOpen,
  saving,
  form,
  canCreatePatient,
  isNurse,
  load,
  apriNuovo,
  salva,
} = usePatients()

onMounted(load)
</script>

<template>
  <div class="pazienti-view">
    <PageHeader
      title="Pazienti"
      subtitle="Elenco dei pazienti visibili per reparto e ruolo."
    >
      <template v-if="canCreatePatient" #actions>
        <Button label="Nuovo paziente" size="small" @click="apriNuovo" />
      </template>
    </PageHeader>

    <InlineError :message="error" />

    <PatientsTable
      v-if="!loading && pazienti.length > 0"
      :patients="pazienti"
    />

    <EmptyState
      v-if="!loading && pazienti.length === 0 && isNurse"
      title="Nessun paziente visibile"
      message="Nessun turno attivo assegnato: nessun paziente visibile."
    />
    <EmptyState
      v-else-if="!loading && pazienti.length === 0"
      title="Nessun paziente in reparto"
      message="Quando saranno creati pazienti attivi, appariranno in questa lista."
    />

    <NewPatientDialog
      v-model:visible="dialogOpen"
      v-model:form="form"
      :saving="saving"
      @save="salva"
    />
  </div>
</template>

<style scoped>
.pazienti-view {
  padding: var(--page-padding);
  max-width: 1200px;
  margin: 0 auto;
}
</style>
