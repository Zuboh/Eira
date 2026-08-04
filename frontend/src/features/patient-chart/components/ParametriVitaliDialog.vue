<script setup lang="ts">
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import { dialogStyle } from '@/components/ui/dialogStyles'
import FormField from '@/components/ui/FormField.vue'
import { statoCoscienzaOptions } from '@/features/patient-chart/form'
import type {
  ParametriVitaliDialogProps,
  ParametriVitaliForm,
  PatientChartSaveEmit,
} from '@/features/patient-chart/types'

const visible = defineModel<boolean>('visible', { required: true })
const form = defineModel<ParametriVitaliForm>('form', { required: true })

defineProps<ParametriVitaliDialogProps>()
const emit = defineEmits<PatientChartSaveEmit>()
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="Nuovi parametri vitali"
    modal
    :style="dialogStyle.lg"
  >
    <form class="form" @submit.prevent="emit('save')">
      <div class="grid">
        <FormField label="Temperatura" for-id="parametri-temperatura" required>
          <InputNumber
            v-model="form.temperatura"
            input-id="parametri-temperatura"
            :minFractionDigits="1"
            :maxFractionDigits="1"
          />
        </FormField>
        <FormField label="FC" for-id="parametri-fc" required>
          <InputNumber
            v-model="form.frequenza_cardiaca"
            input-id="parametri-fc"
          />
        </FormField>
        <FormField
          label="PA sistolica"
          for-id="parametri-pa-sistolica"
          required
        >
          <InputNumber
            v-model="form.pressione_sistolica"
            input-id="parametri-pa-sistolica"
          />
        </FormField>
        <FormField
          label="PA diastolica"
          for-id="parametri-pa-diastolica"
          required
        >
          <InputNumber
            v-model="form.pressione_diastolica"
            input-id="parametri-pa-diastolica"
          />
        </FormField>
        <FormField label="FR" for-id="parametri-fr" required>
          <InputNumber
            v-model="form.frequenza_respiratoria"
            input-id="parametri-fr"
          />
        </FormField>
        <FormField label="SpO₂" for-id="parametri-spo2" required>
          <InputNumber
            v-model="form.saturazione_o2"
            input-id="parametri-spo2"
          />
        </FormField>
        <FormField
          label="Scala dolore (NRS)"
          for-id="parametri-dolore"
          required
        >
          <InputNumber
            v-model="form.scala_dolore"
            input-id="parametri-dolore"
            :min="0"
            :max="10"
          />
        </FormField>
      </div>
      <FormField
        label="Stato di coscienza"
        for-id="parametri-coscienza"
        required
      >
        <Select
          v-model="form.stato_coscienza"
          input-id="parametri-coscienza"
          :options="statoCoscienzaOptions"
          optionLabel="label"
          optionValue="value"
        />
      </FormField>
      <div class="checkbox-row">
        <Checkbox v-model="form.ossigeno" inputId="ossigeno" binary />
        <label for="ossigeno">Ossigenoterapia in corso</label>
      </div>
      <FormField label="Note" for-id="parametri-note">
        <Textarea id="parametri-note" v-model="form.note" rows="3" autoResize />
      </FormField>
      <Button type="submit" label="Salva" :loading="saving" />
    </form>
  </Dialog>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 720px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
