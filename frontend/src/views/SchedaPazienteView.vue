<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import { dialogStyle } from '@/components/ui/dialogStyles'
import StatusBadge from '@/components/StatusBadge.vue'
import CedemaTab from '@/features/patient-chart/components/CedemaTab.vue'
import ValutazioniTab from '@/features/patient-chart/components/ValutazioniTab.vue'
import StoricoSbarTab from '@/features/patient-chart/components/StoricoSbarTab.vue'
import { usePatientChart } from '@/features/patient-chart/usePatientChart'

const route = useRoute()
const pazienteId = computed(() => Number(route.params.id))

const {
  paziente,
  error,
  cedema,
  norton,
  conley,
  consegne,
  consegneLoaded,
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

onMounted(load)
</script>

<template>
  <div class="scheda-view">
    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <template v-if="paziente">
      <div class="header">
        <div>
          <h1>{{ paziente.cognome }} {{ paziente.nome }}</h1>
          <p class="sub mono">
            Letto {{ paziente.letto }} · {{ paziente.eta }} anni · ricovero {{ paziente.data_ricovero }}
          </p>
          <p class="diagnosi">{{ paziente.diagnosi_ingresso }}</p>
        </div>
        <div class="header-actions">
          <StatusBadge :status="paziente.dimesso ? 'dimesso' : 'attivo'" :label="paziente.dimesso ? 'Dimesso' : 'Attivo'" />
          <Button v-if="canEditPatient" label="Modifica" size="small" severity="secondary" @click="apriEdit" />
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
            <CedemaTab :entries="cedema" :can-create="canCreateClinicalEntries" @new-entry="apriCedema" />
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
            <StoricoSbarTab :consegne="consegne" />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </template>

    <Dialog v-model:visible="editing" header="Modifica paziente" modal :style="dialogStyle.sm">
      <form class="form" @submit.prevent="salvaEdit">
        <label>Letto<InputText v-model="editForm.letto" required /></label>
        <label>Diagnosi ingresso<InputText v-model="editForm.diagnosi_ingresso" required /></label>
        <label class="checkbox">
          <input type="checkbox" v-model="editForm.dimesso" /> Dimesso
        </label>
        <Button type="submit" label="Salva" />
      </form>
    </Dialog>

    <Dialog v-model:visible="cedemaDialog" header="Nuova voce CEDEMA" modal :style="dialogStyle.md">
      <form class="form" @submit.prevent="salvaCedema">
        <label v-if="assegnazioni.length > 0">
          Turno (opzionale)
          <Select v-model="cedemaForm.turno_id" :options="assegnazioni" optionLabel="turno_id" optionValue="turno_id" showClear placeholder="Nessuno" />
        </label>
        <label>Coscienza<Textarea v-model="cedemaForm.coscienza" rows="2" required /></label>
        <label>Emotività<Textarea v-model="cedemaForm.emotivita" rows="2" required /></label>
        <label>Dolore<Textarea v-model="cedemaForm.dolore" rows="2" required /></label>
        <label>Emodinamica<Textarea v-model="cedemaForm.emodinamica" rows="2" required /></label>
        <label>Mobilizzazione<Textarea v-model="cedemaForm.mobilizzazione" rows="2" required /></label>
        <label>Allert<Textarea v-model="cedemaForm.allert" rows="2" required /></label>
        <Button type="submit" label="Salva" :loading="cedemaSaving" />
      </form>
    </Dialog>

    <Dialog v-model:visible="nortonDialog" header="Nuova valutazione Norton" modal :style="dialogStyle.sm">
      <form class="form" @submit.prevent="salvaNorton">
        <label>Data<InputText v-model="nortonForm.data_valutazione" type="date" required /></label>
        <label>Condizioni generali (1-4)<InputNumber v-model="nortonForm.condizioni_generali" :min="1" :max="4" /></label>
        <label>Stato mentale (1-4)<InputNumber v-model="nortonForm.stato_mentale" :min="1" :max="4" /></label>
        <label>Attività (1-4)<InputNumber v-model="nortonForm.attivita" :min="1" :max="4" /></label>
        <label>Mobilità (1-4)<InputNumber v-model="nortonForm.mobilita" :min="1" :max="4" /></label>
        <label>Incontinenza (1-4)<InputNumber v-model="nortonForm.incontinenza" :min="1" :max="4" /></label>
        <Button type="submit" label="Salva" :loading="nortonSaving" />
      </form>
    </Dialog>

    <Dialog v-model:visible="conleyDialog" header="Nuova valutazione Conley" modal :style="dialogStyle.sm">
      <form class="form" @submit.prevent="salvaConley">
        <label>Data<InputText v-model="conleyForm.data_valutazione" type="date" required /></label>
        <label>Storia cadute<InputNumber v-model="conleyForm.storia_cadute" :min="0" /></label>
        <label>Deficit visivo<InputNumber v-model="conleyForm.deficit_visivo" :min="0" /></label>
        <label>Alterazione eliminazione<InputNumber v-model="conleyForm.alterazione_eliminazione" :min="0" /></label>
        <label>Agitazione<InputNumber v-model="conleyForm.agitazione" :min="0" /></label>
        <label>Deficit vista osservato<InputNumber v-model="conleyForm.deficit_vista_osservato" :min="0" /></label>
        <label>Andatura alterata<InputNumber v-model="conleyForm.andatura_alterata" :min="0" /></label>
        <Button type="submit" label="Salva" :loading="conleySaving" />
      </form>
    </Dialog>
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

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--steel);
}

.form label.checkbox {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.error {
  color: var(--state-urgente);
  font-size: 0.8125rem;
}

.hint {
  color: var(--steel);
  font-size: 0.875rem;
}
</style>
