<script setup lang="ts">
import InlineError from '@/components/ui/InlineError.vue'
import Button from 'primevue/button'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
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
      <InlineError :message="error" />
      <FormField
        v-slot="{ fieldAttrs }"
        label="Nome"
        forId="paziente-nome"
        required
      >
        <InputText
          v-bind="fieldAttrs"
          id="paziente-nome"
          v-model="form.nome"
          required
        />
      </FormField>
      <FormField
        v-slot="{ fieldAttrs }"
        label="Cognome"
        forId="paziente-cognome"
        required
      >
        <InputText
          v-bind="fieldAttrs"
          id="paziente-cognome"
          v-model="form.cognome"
          required
        />
      </FormField>
      <FormField
        v-slot="{ fieldAttrs }"
        label="Età"
        forId="paziente-eta"
        required
      >
        <InputNumber
          v-model="form.eta"
          :pt="{ pcInputText: { root: fieldAttrs } }"
          inputId="paziente-eta"
          :min="0"
          :max="120"
          required
        />
      </FormField>
      <FormField
        v-slot="{ fieldAttrs }"
        label="Letto"
        forId="paziente-letto"
        required
      >
        <InputText
          v-bind="fieldAttrs"
          id="paziente-letto"
          v-model="form.letto"
          required
        />
      </FormField>
      <FormField
        v-slot="{ fieldAttrs }"
        label="Data ricovero"
        forId="paziente-data-ricovero"
        required
      >
        <DatePicker
          v-model="form.data_ricovero"
          :pt="{ pcInputText: { root: fieldAttrs } }"
          inputId="paziente-data-ricovero"
          dateFormat="yy-mm-dd"
          required
        />
      </FormField>
      <FormField
        v-slot="{ fieldAttrs }"
        label="Diagnosi ingresso"
        forId="paziente-diagnosi"
        required
      >
        <Textarea
          v-bind="fieldAttrs"
          id="paziente-diagnosi"
          v-model="form.diagnosi_ingresso"
          class="diagnosi-input"
          rows="3"
          autoResize
          required
        />
      </FormField>
      <Button
        class="eira-saving-button"
        type="submit"
        label="Crea"
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

.diagnosi-input {
  width: 100%;
}
</style>
