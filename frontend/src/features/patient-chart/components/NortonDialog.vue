<script setup lang="ts">
import InlineError from '@/components/ui/InlineError.vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import { dialogStyle } from '@/components/ui/dialogStyles'
import FormField from '@/components/ui/FormField.vue'
import type {
  NortonForm,
  PatientChartSaveEmit,
  ValutazioneDialogProps,
} from '@/features/patient-chart/types'

const visible = defineModel<boolean>('visible', { required: true })
const form = defineModel<NortonForm>('form', { required: true })

defineProps<ValutazioneDialogProps>()

const emit = defineEmits<PatientChartSaveEmit>()
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="Nuova valutazione Norton"
    modal
    :style="dialogStyle.sm"
  >
    <form class="form" @submit.prevent="emit('save')">
      <InlineError :message="error" />
      <FormField
        v-slot="{ fieldAttrs }"
        label="Data"
        for-id="norton-data"
        required
        ><InputText
          v-bind="fieldAttrs"
          id="norton-data"
          v-model="form.data_valutazione"
          type="date"
          required
      /></FormField>
      <FormField
        v-slot="{ fieldAttrs }"
        label="Condizioni generali (1-4)"
        for-id="norton-condizioni"
        ><InputNumber
          v-model="form.condizioni_generali"
          :pt="{ pcInputText: { root: fieldAttrs } }"
          input-id="norton-condizioni"
          :min="1"
          :max="4"
      /></FormField>
      <FormField
        v-slot="{ fieldAttrs }"
        label="Stato mentale (1-4)"
        for-id="norton-stato-mentale"
        ><InputNumber
          v-model="form.stato_mentale"
          :pt="{ pcInputText: { root: fieldAttrs } }"
          input-id="norton-stato-mentale"
          :min="1"
          :max="4"
      /></FormField>
      <FormField
        v-slot="{ fieldAttrs }"
        label="Attività (1-4)"
        for-id="norton-attivita"
        ><InputNumber
          v-model="form.attivita"
          :pt="{ pcInputText: { root: fieldAttrs } }"
          input-id="norton-attivita"
          :min="1"
          :max="4"
      /></FormField>
      <FormField
        v-slot="{ fieldAttrs }"
        label="Mobilità (1-4)"
        for-id="norton-mobilita"
        ><InputNumber
          v-model="form.mobilita"
          :pt="{ pcInputText: { root: fieldAttrs } }"
          input-id="norton-mobilita"
          :min="1"
          :max="4"
      /></FormField>
      <FormField
        v-slot="{ fieldAttrs }"
        label="Incontinenza (1-4)"
        for-id="norton-incontinenza"
        ><InputNumber
          v-model="form.incontinenza"
          :pt="{ pcInputText: { root: fieldAttrs } }"
          input-id="norton-incontinenza"
          :min="1"
          :max="4"
      /></FormField>
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
</style>
