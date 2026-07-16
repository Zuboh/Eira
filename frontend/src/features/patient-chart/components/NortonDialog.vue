<script setup lang="ts">
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import { dialogStyle } from '@/components/ui/dialogStyles'
import FormField from '@/components/ui/FormField.vue'
import type { NortonForm, PatientChartSaveEmit, ValutazioneDialogProps } from '@/features/patient-chart/types'

const visible = defineModel<boolean>('visible', { required: true })
const form = defineModel<NortonForm>('form', { required: true })

defineProps<ValutazioneDialogProps>()

const emit = defineEmits<PatientChartSaveEmit>()
</script>

<template>
  <Dialog v-model:visible="visible" header="Nuova valutazione Norton" modal :style="dialogStyle.sm">
    <form class="form" @submit.prevent="emit('save')">
      <FormField label="Data" required><InputText v-model="form.data_valutazione" type="date" required /></FormField>
      <FormField label="Condizioni generali (1-4)"><InputNumber v-model="form.condizioni_generali" :min="1" :max="4" /></FormField>
      <FormField label="Stato mentale (1-4)"><InputNumber v-model="form.stato_mentale" :min="1" :max="4" /></FormField>
      <FormField label="Attività (1-4)"><InputNumber v-model="form.attivita" :min="1" :max="4" /></FormField>
      <FormField label="Mobilità (1-4)"><InputNumber v-model="form.mobilita" :min="1" :max="4" /></FormField>
      <FormField label="Incontinenza (1-4)"><InputNumber v-model="form.incontinenza" :min="1" :max="4" /></FormField>
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
