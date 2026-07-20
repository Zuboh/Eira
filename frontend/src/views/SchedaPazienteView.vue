<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
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
  loading,
  error,
  timeline,
  norton,
  conley,
  parametriVitali,
  assegnazioni,
  editing,
  editForm,
  consegnaDrawer,
  consegnaSaving,
  consegnaForm,
  consegnaInsight,
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
    <InlineError :message="error" />

    <div v-if="loading && !paziente" class="header-skeleton">
      <SkeletonBlock :lines="3" style="max-width: 22rem" />
    </div>

    <template v-if="paziente">
      <div class="header">
        <div>
          <h1>{{ paziente.cognome }} {{ paziente.nome }}</h1>
          <p class="sub mono">
            Letto {{ paziente.letto }} · {{ paziente.eta }} anni · ricovero
            {{ paziente.data_ricovero }}
          </p>
          <p class="diagnosi">{{ paziente.diagnosi_ingresso }}</p>
        </div>
        <div class="header-actions">
          <StatusBadge
            :status="paziente.dimesso ? 'dimesso' : 'attivo'"
            :label="paziente.dimesso ? 'Dimesso' : 'Attivo'"
          />
          <Button
            v-if="canEditPatient"
            label="Modifica"
            size="small"
            severity="secondary"
            @click="apriEdit"
          />
        </div>
      </div>

      <ParametriVitaliTab
        :entries="parametriVitali"
        :can-create="canCreateClinicalEntries"
        @new-entry="apriParametri"
      />

      <Tabs v-model:value="activeTab">
        <TabList>
          <Tab value="diario">Diario clinico</Tab>
          <Tab value="valutazioni">Scale di valutazione</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="diario">
            <ClinicalTimelineTab
              :entries="timeline"
              :can-create="canCreateClinicalEntries"
              @new-entry="apriConsegna"
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
      @save="salvaEdit"
    />

    <GenericConsegnaDialog
      v-model:visible="consegnaDrawer"
      v-model:form="consegnaForm"
      :assegnazioni="assegnazioni"
      :saving="consegnaSaving"
      :insight="consegnaInsight"
      hide-paziente
      @save="salvaConsegna"
    />

    <NortonDialog
      v-model:visible="nortonDialog"
      v-model:form="nortonForm"
      :saving="nortonSaving"
      @save="salvaNorton"
    />

    <ConleyDialog
      v-model:visible="conleyDialog"
      v-model:form="conleyForm"
      :saving="conleySaving"
      @save="salvaConley"
    />

    <ParametriVitaliDialog
      v-model:visible="parametriDialog"
      v-model:form="parametriForm"
      :saving="parametriSaving"
      @save="salvaParametri"
    />
  </div>
</template>

<style scoped>
.scheda-view {
  padding: var(--page-padding);
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sub {
  color: var(--steel);
  font-size: 0.8125rem;
  margin: 4px 0;
}

.diagnosi {
  color: var(--ink);
  font-size: 0.9375rem;
}

.mono {
  font-family: var(--mono);
  font-size: 0.8125rem;
}
</style>
