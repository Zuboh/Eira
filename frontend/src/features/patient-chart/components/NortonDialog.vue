<script setup lang="ts">
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
      <FormField label="Data" for-id="norton-data" required
        ><InputText
          id="norton-data"
          v-model="form.data_valutazione"
          type="date"
          required
      /></FormField>
      <FormField label="Condizioni generali (1-4)" for-id="norton-condizioni"
        ><InputNumber
          v-model="form.condizioni_generali"
          input-id="norton-condizioni"
          :min="1"
          :max="4"
      /></FormField>
      <FormField label="Stato mentale (1-4)" for-id="norton-stato-mentale"
        ><InputNumber
          v-model="form.stato_mentale"
          input-id="norton-stato-mentale"
          :min="1"
          :max="4"
      /></FormField>
      <FormField label="Attività (1-4)" for-id="norton-attivita"
        ><InputNumber
          v-model="form.attivita"
          input-id="norton-attivita"
          :min="1"
          :max="4"
      /></FormField>
      <FormField label="Mobilità (1-4)" for-id="norton-mobilita"
        ><InputNumber
          v-model="form.mobilita"
          input-id="norton-mobilita"
          :min="1"
          :max="4"
      /></FormField>
      <FormField label="Incontinenza (1-4)" for-id="norton-incontinenza"
        ><InputNumber
          v-model="form.incontinenza"
          input-id="norton-incontinenza"
          :min="1"
          :max="4"
      /></FormField>
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
</style>
