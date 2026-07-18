<script setup lang="ts">
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import { dialogStyle } from '@/components/ui/dialogStyles'
import FormField from '@/components/ui/FormField.vue'
import type {
  CedemaDialogProps,
  CedemaForm,
  PatientChartSaveEmit,
} from '@/features/patient-chart/types'

const visible = defineModel<boolean>('visible', { required: true })
const form = defineModel<CedemaForm>('form', { required: true })

defineProps<CedemaDialogProps>()

const emit = defineEmits<PatientChartSaveEmit>()
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="Nuova voce CEDEMA"
    modal
    :style="dialogStyle.md"
  >
    <form class="form" @submit.prevent="emit('save')">
      <FormField v-if="assegnazioni.length > 0" label="Turno (opzionale)">
        <Select
          v-model="form.turno_id"
          :options="assegnazioni"
          optionLabel="turno_id"
          optionValue="turno_id"
          showClear
          placeholder="Nessuno"
        />
      </FormField>
      <FormField label="Coscienza" required
        ><Textarea v-model="form.coscienza" rows="2" required
      /></FormField>
      <FormField label="Emotività" required
        ><Textarea v-model="form.emotivita" rows="2" required
      /></FormField>
      <FormField label="Dolore" required
        ><Textarea v-model="form.dolore" rows="2" required
      /></FormField>
      <FormField label="Emodinamica" required
        ><Textarea v-model="form.emodinamica" rows="2" required
      /></FormField>
      <FormField label="Mobilizzazione" required
        ><Textarea v-model="form.mobilizzazione" rows="2" required
      /></FormField>
      <FormField label="Allert" required
        ><Textarea v-model="form.allert" rows="2" required
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
