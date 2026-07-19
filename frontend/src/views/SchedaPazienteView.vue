<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
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
import CedemaDialog from '@/features/patient-chart/components/CedemaDialog.vue'
import CedemaTab from '@/features/patient-chart/components/CedemaTab.vue'
import ConleyDialog from '@/features/patient-chart/components/ConleyDialog.vue'
import NortonDialog from '@/features/patient-chart/components/NortonDialog.vue'
import PatientEditDialog from '@/features/patient-chart/components/PatientEditDialog.vue'
import ValutazioniTab from '@/features/patient-chart/components/ValutazioniTab.vue'
import StoricoSbarTab from '@/features/patient-chart/components/StoricoSbarTab.vue'
import SbarDialog from '@/features/sbar/components/SbarDialog.vue'
import { usePatientChart } from '@/features/patient-chart/usePatientChart'

const route = useRoute()
const pazienteId = computed(() => Number(route.params.id))

const {
  paziente,
  loading,
  error,
  cedema,
  norton,
  conley,
  consegne,
  consegneLoaded,
  sbarLoading,
  assegnazioni,
  editing,
  editForm,
  cedemaDialog,
  cedemaSaving,
  cedemaForm,
  nortonDialog,
  nortonSaving,
  nortonForm,
  conleyDialog,
  conleySaving,
  conleyForm,
  sbarDialog,
  sbarSaving,
  sbarForm,
  sbarAssegnazioni,
  sbarCreateError,
  canEditPatient,
  canCreateClinicalEntries,
  load,
  loadConsegneSbar,
  apriEdit,
  salvaEdit,
  apriCedema,
  salvaCedema,
  apriNorton,
  salvaNorton,
  apriConley,
  salvaConley,
  apriSbar,
  salvaSbar,
} = usePatientChart(pazienteId)

const activeTab = ref('cedema')

watch(activeTab, async (tab) => {
  if (tab !== 'sbar' || consegneLoaded.value) return

  try {
    await loadConsegneSbar()
  } catch {
    // The composable keeps the page-level error for the primary chart load.
    // Keep the lazy SBAR tab non-blocking until the backend exposes a patient-scoped endpoint.
  }
})

async function apriNuovaSbar() {
  activeTab.value = 'sbar'
  await apriSbar()
}

onMounted(load)
</script>

<template>
  <div class="scheda-view">
    <InlineError :message="error" />
    <InlineError :message="sbarCreateError" />

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
            v-if="canCreateClinicalEntries"
            label="Nuova SBAR"
            size="small"
            severity="secondary"
            @click="apriNuovaSbar"
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

      <Tabs v-model:value="activeTab">
        <TabList>
          <Tab value="cedema">CEDEMA</Tab>
          <Tab value="valutazioni">Valutazioni</Tab>
          <Tab value="sbar">Storico SBAR</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="cedema">
            <CedemaTab
              :entries="cedema"
              :can-create="canCreateClinicalEntries"
              @new-entry="apriCedema"
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

          <TabPanel value="sbar">
            <StoricoSbarTab :consegne="consegne" :loading="sbarLoading" />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </template>

    <PatientEditDialog
      v-model:visible="editing"
      v-model:form="editForm"
      @save="salvaEdit"
    />

    <CedemaDialog
      v-model:visible="cedemaDialog"
      v-model:form="cedemaForm"
      :assegnazioni="assegnazioni"
      :saving="cedemaSaving"
      @save="salvaCedema"
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

    <SbarDialog
      v-model:visible="sbarDialog"
      v-model:form="sbarForm"
      :is-editing="false"
      :saving="sbarSaving"
      :assegnazioni="sbarAssegnazioni"
      hide-paziente
      @save="salvaSbar"
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
