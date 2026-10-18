<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import Button from 'primevue/button'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import InlineError from '@/components/ui/InlineError.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import ClinicalTimelineTab from '@/features/patient-chart/components/ClinicalTimelineTab.vue'
import ConleyDialog from '@/features/patient-chart/components/ConleyDialog.vue'
import GenericConsegnaDialog from '@/features/patient-chart/components/GenericConsegnaDialog.vue'
import NortonDialog from '@/features/patient-chart/components/NortonDialog.vue'
import ParametriVitaliDialog from '@/features/patient-chart/components/ParametriVitaliDialog.vue'
import ParametriVitaliTab from '@/features/patient-chart/components/ParametriVitaliTab.vue'
import PatientEditDialog from '@/features/patient-chart/components/PatientEditDialog.vue'
import ValutazioniTab from '@/features/patient-chart/components/ValutazioniTab.vue'
import { usePatientChart } from '@/features/patient-chart/usePatientChart'

const route = useRoute()
const pazienteId = computed(() => Number(route.params.id))

const {
  paziente,
  nomeAutore,
  loading,
  error,
  timeline,
  norton,
  conley,
  parametriVitali,
  assegnazioni,
  editing,
  editSaving,
  editForm,
  consegnaDrawer,
  consegnaSaving,
  consegnaError,
  consegnaForm,
  nortonDialog,
  nortonSaving,
  nortonForm,
  conleyDialog,
  conleySaving,
  conleyForm,
  parametriDialog,
  parametriSaving,
  parametriForm,
  canEditPatient,
  canCreateClinicalEntries,
  load,
  apriEdit,
  salvaEdit,
  apriConsegna,
  salvaConsegna,
  copiedKeys,
  canCopyForward,
  copyForwardLoading,
  riprendiUltima,
  riprendiSezione,
  apriNorton,
  salvaNorton,
  apriConley,
  salvaConley,
  apriParametri,
  salvaParametri,
} = usePatientChart(pazienteId)

const activeTab = ref('diario')

onMounted(load)
</script>

<template>
  <div class="scheda-view">
    <InlineError :message="error" retryable @retry="load" />

    <div v-if="loading && !paziente" class="header-skeleton">
      <SkeletonBlock :lines="3" style="max-width: 22rem" />
    </div>

    <template v-if="paziente">
      <RouterLink :to="{ name: 'pazienti' }" class="back-link"
        ><i class="pi pi-arrow-left" aria-hidden="true" /> Pazienti</RouterLink
      >
      <PageHeader :title="`${paziente.cognome} ${paziente.nome}`">
        <template #actions>
          <StatusBadge :status="paziente.dimesso ? 'dimesso' : 'attivo'" />
          <Button
            v-if="canEditPatient"
            icon="pi pi-pencil"
            label="Modifica"
            severity="secondary"
            outlined
            @click="apriEdit"
          />
        </template>
      </PageHeader>
      <dl class="patient-properties">
        <div>
          <dt>Letto</dt>
          <dd class="bed">{{ paziente.letto }}</dd>
        </div>
        <div>
          <dt>Età</dt>
          <dd>{{ paziente.eta }} anni</dd>
        </div>
        <div>
          <dt>Ricovero</dt>
          <dd>{{ paziente.data_ricovero }}</dd>
        </div>
        <div class="diagnosis">
          <dt>Diagnosi d’ingresso</dt>
          <dd>{{ paziente.diagnosi_ingresso }}</dd>
        </div>
      </dl>

      <Tabs v-model:value="activeTab">
        <TabList>
          <Tab value="diario">Diario clinico</Tab>
          <Tab value="parametri">Parametri vitali</Tab>
          <Tab value="valutazioni">Scale di valutazione</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="diario">
            <ClinicalTimelineTab
              :entries="timeline"
              :nome-autore="nomeAutore"
              :can-create="canCreateClinicalEntries"
              @new-entry="apriConsegna"
            />
          </TabPanel>

          <TabPanel value="parametri">
            <ParametriVitaliTab
              :entries="parametriVitali"
              :can-create="canCreateClinicalEntries"
              @new-entry="apriParametri"
            />
          </TabPanel>
          <TabPanel value="valutazioni">
            <ValutazioniTab
              :norton="norton"
              :conley="conley"
              :can-create="canCreateClinicalEntries"
              @new-norton="apriNorton"
              @new-conley="apriConley"
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </template>

    <PatientEditDialog
      v-model:visible="editing"
      v-model:form="editForm"
      :saving="editSaving"
      :error="error"
      @save="salvaEdit"
    />

    <GenericConsegnaDialog
      v-model:visible="consegnaDrawer"
      v-model:form="consegnaForm"
      :assegnazioni="assegnazioni"
      :saving="consegnaSaving"
      :error="consegnaError"
      :copied-keys="copiedKeys"
      :can-copy-forward="canCopyForward"
      :copy-forward-loading="copyForwardLoading"
      hide-paziente
      @save="salvaConsegna"
      @copy-forward="riprendiUltima"
      @copy-forward-section="riprendiSezione"
    />

    <NortonDialog
      v-model:visible="nortonDialog"
      v-model:form="nortonForm"
      :error="error"
      :saving="nortonSaving"
      @save="salvaNorton"
    />

    <ConleyDialog
      v-model:visible="conleyDialog"
      v-model:form="conleyForm"
      :error="error"
      :saving="conleySaving"
      @save="salvaConley"
    />

    <ParametriVitaliDialog
      v-model:visible="parametriDialog"
      v-model:form="parametriForm"
      :error="error"
      :saving="parametriSaving"
      @save="salvaParametri"
    />
  </div>
</template>

<style scoped>
.scheda-view {
  padding: var(--eira-page-padding);
  max-width: var(--eira-page-lg);
  margin: 0 auto;
  min-width: 0;
}
.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--eira-space-2);
  min-height: var(--eira-size-touch);
  margin-bottom: var(--eira-space-3);
  text-decoration: none;
  color: var(--eira-text-secondary);
}
.patient-properties {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--eira-space-5);
  margin: 0 0 var(--eira-space-6);
}
.patient-properties dt {
  color: var(--eira-text-secondary);
  font-size: var(--eira-font-small);
}
.patient-properties dd {
  margin: var(--eira-space-1) 0 0;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}
.patient-properties .bed {
  font-size: 1.125rem;
  font-weight: 600;
}
.diagnosis {
  grid-column: 1 / -1;
}
@media (max-width: 47.9375rem) {
  .patient-properties {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
