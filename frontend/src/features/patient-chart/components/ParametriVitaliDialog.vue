<script setup lang="ts">
import InlineError from '@/components/ui/InlineError.vue'
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
      <InlineError :message="error" />
      <div class="grid">
        <FormField
          v-slot="{ fieldAttrs }"
          label="Temperatura"
          for-id="parametri-temperatura"
          required
        >
          <InputNumber
            v-model="form.temperatura"
            :pt="{ pcInputText: { root: fieldAttrs } }"
            input-id="parametri-temperatura"
            :minFractionDigits="1"
            :maxFractionDigits="1"
          />
        </FormField>
        <FormField
          v-slot="{ fieldAttrs }"
          label="FC"
          for-id="parametri-fc"
          required
        >
          <InputNumber
            v-model="form.frequenza_cardiaca"
            :pt="{ pcInputText: { root: fieldAttrs } }"
            input-id="parametri-fc"
          />
        </FormField>
        <FormField
          v-slot="{ fieldAttrs }"
          label="PA sistolica"
          for-id="parametri-pa-sistolica"
          required
        >
          <InputNumber
            v-model="form.pressione_sistolica"
            :pt="{ pcInputText: { root: fieldAttrs } }"
            input-id="parametri-pa-sistolica"
          />
        </FormField>
        <FormField
          v-slot="{ fieldAttrs }"
          label="PA diastolica"
          for-id="parametri-pa-diastolica"
          required
        >
          <InputNumber
            v-model="form.pressione_diastolica"
            :pt="{ pcInputText: { root: fieldAttrs } }"
            input-id="parametri-pa-diastolica"
          />
        </FormField>
        <FormField
          v-slot="{ fieldAttrs }"
          label="FR"
          for-id="parametri-fr"
          required
        >
          <InputNumber
            v-model="form.frequenza_respiratoria"
            :pt="{ pcInputText: { root: fieldAttrs } }"
            input-id="parametri-fr"
          />
        </FormField>
        <FormField
          v-slot="{ fieldAttrs }"
          label="SpO₂"
          for-id="parametri-spo2"
          required
        >
          <InputNumber
            v-model="form.saturazione_o2"
            :pt="{ pcInputText: { root: fieldAttrs } }"
            input-id="parametri-spo2"
          />
        </FormField>
        <FormField
          v-slot="{ fieldAttrs }"
          label="Scala dolore (NRS)"
          for-id="parametri-dolore"
          required
        >
          <InputNumber
            v-model="form.scala_dolore"
            :pt="{ pcInputText: { root: fieldAttrs } }"
            input-id="parametri-dolore"
            :min="0"
            :max="10"
          />
        </FormField>
      </div>
      <FormField
        v-slot="{ fieldAttrs }"
        label="Stato di coscienza"
        for-id="parametri-coscienza"
        required
      >
        <Select
          v-model="form.stato_coscienza"
          :pt="{ label: fieldAttrs }"
          input-id="parametri-coscienza"
          :options="statoCoscienzaOptions"
          optionLabel="label"
          optionValue="value"
        />
      </FormField>
      <label class="checkbox-row" for="ossigeno">
        <Checkbox v-model="form.ossigeno" inputId="ossigeno" binary />
        <span>Ossigenoterapia in corso</span>
      </label>
      <FormField v-slot="{ fieldAttrs }" label="Note" for-id="parametri-note">
        <Textarea
          v-bind="fieldAttrs"
          id="parametri-note"
          v-model="form.note"
          rows="3"
          autoResize
        />
      </FormField>
      <Button
        class="eira-saving-button"
        type="submit"
        label="Salva"
        :loading="saving"
      />
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
  min-height: var(--eira-size-touch);
  cursor: pointer;
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
