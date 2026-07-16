<script setup lang="ts">
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import { dialogStyle } from '@/components/ui/dialogStyles'
import FormField from '@/components/ui/FormField.vue'
import type { ConleyForm, PatientChartSaveEmit, ValutazioneDialogProps } from '@/features/patient-chart/types'

const visible = defineModel<boolean>('visible', { required: true })
const form = defineModel<ConleyForm>('form', { required: true })

defineProps<ValutazioneDialogProps>()

const emit = defineEmits<PatientChartSaveEmit>()
</script>

<template>
  <Dialog v-model:visible="visible" header="Nuova valutazione Conley" modal :style="dialogStyle.sm">
    <form class="form" @submit.prevent="emit('save')">
      <FormField label="Data" required><InputText v-model="form.data_valutazione" type="date" required /></FormField>
      <FormField label="Storia cadute"><InputNumber v-model="form.storia_cadute" :min="0" /></FormField>
      <FormField label="Deficit visivo"><InputNumber v-model="form.deficit_visivo" :min="0" /></FormField>
      <FormField label="Alterazione eliminazione"><InputNumber v-model="form.alterazione_eliminazione" :min="0" /></FormField>
      <FormField label="Agitazione"><InputNumber v-model="form.agitazione" :min="0" /></FormField>
      <FormField label="Deficit vista osservato"><InputNumber v-model="form.deficit_vista_osservato" :min="0" /></FormField>
      <FormField label="Andatura alterata"><InputNumber v-model="form.andatura_alterata" :min="0" /></FormField>
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
