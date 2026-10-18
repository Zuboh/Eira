<script setup lang="ts">
import InlineError from '@/components/ui/InlineError.vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import { dialogStyle } from '@/components/ui/dialogStyles'
import FormField from '@/components/ui/FormField.vue'
import type {
  PatientChartSaveEmit,
  PatientEditForm,
} from '@/features/patient-chart/types'

const visible = defineModel<boolean>('visible', { required: true })
const form = defineModel<PatientEditForm>('form', { required: true })

defineProps<{ saving: boolean; error?: string }>()

const emit = defineEmits<PatientChartSaveEmit>()
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="Modifica paziente"
    modal
    :style="dialogStyle.sm"
  >
    <form class="form" @submit.prevent="emit('save')">
      <InlineError :message="error" />
      <FormField
        v-slot="{ fieldAttrs }"
        label="Letto"
        for-id="paziente-modifica-letto"
        required
      >
        <InputText
          v-bind="fieldAttrs"
          id="paziente-modifica-letto"
          v-model="form.letto"
          required
        />
      </FormField>
      <FormField
        v-slot="{ fieldAttrs }"
        label="Diagnosi ingresso"
        for-id="paziente-modifica-diagnosi"
        required
      >
        <InputText
          v-bind="fieldAttrs"
          id="paziente-modifica-diagnosi"
          v-model="form.diagnosi_ingresso"
          required
        />
      </FormField>
      <label class="checkbox">
        <input v-model="form.dimesso" type="checkbox" /> Dimesso
      </label>
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

.checkbox {
  min-height: var(--eira-size-touch);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--eira-text-secondary);
  font-size: 0.8125rem;
  font-weight: 600;
}
</style>
