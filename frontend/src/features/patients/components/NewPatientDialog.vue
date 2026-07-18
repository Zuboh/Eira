<script setup lang="ts">
import Button from 'primevue/button'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import FormField from '@/components/ui/FormField.vue'
import { dialogStyle } from '@/components/ui/dialogStyles'
import type {
  NewPatientDialogProps,
  NewPatientForm,
  PatientDialogEmits,
} from '@/features/patients/types'

const visible = defineModel<boolean>('visible', { required: true })
const form = defineModel<NewPatientForm>('form', { required: true })

defineProps<NewPatientDialogProps>()

const emit = defineEmits<PatientDialogEmits>()
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="Nuovo paziente"
    modal
    :style="dialogStyle.md"
  >
    <form class="form" @submit.prevent="emit('save')">
      <FormField label="Nome" forId="paziente-nome" required>
        <InputText id="paziente-nome" v-model="form.nome" required />
      </FormField>
      <FormField label="Cognome" forId="paziente-cognome" required>
        <InputText id="paziente-cognome" v-model="form.cognome" required />
      </FormField>
      <FormField label="Età" forId="paziente-eta" required>
        <InputNumber
          v-model="form.eta"
          inputId="paziente-eta"
          :min="0"
          :max="120"
          required
        />
      </FormField>
      <FormField label="Letto" forId="paziente-letto" required>
        <InputText id="paziente-letto" v-model="form.letto" required />
      </FormField>
      <FormField label="Data ricovero" forId="paziente-data-ricovero" required>
        <DatePicker
          v-model="form.data_ricovero"
          inputId="paziente-data-ricovero"
          dateFormat="yy-mm-dd"
          required
        />
      </FormField>
      <FormField label="Diagnosi ingresso" forId="paziente-diagnosi" required>
        <InputText
          id="paziente-diagnosi"
          v-model="form.diagnosi_ingresso"
          required
        />
      </FormField>
      <Button type="submit" label="Crea" :loading="saving" />
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
