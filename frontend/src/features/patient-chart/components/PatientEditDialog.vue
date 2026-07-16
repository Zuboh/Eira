<script setup lang="ts">
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import { dialogStyle } from '@/components/ui/dialogStyles'
import FormField from '@/components/ui/FormField.vue'
import type { PatientChartSaveEmit, PatientEditForm } from '@/features/patient-chart/types'

const visible = defineModel<boolean>('visible', { required: true })
const form = defineModel<PatientEditForm>('form', { required: true })

const emit = defineEmits<PatientChartSaveEmit>()
</script>

<template>
  <Dialog v-model:visible="visible" header="Modifica paziente" modal :style="dialogStyle.sm">
    <form class="form" @submit.prevent="emit('save')">
      <FormField label="Letto" required>
        <InputText v-model="form.letto" required />
      </FormField>
      <FormField label="Diagnosi ingresso" required>
        <InputText v-model="form.diagnosi_ingresso" required />
      </FormField>
      <label class="checkbox">
        <input type="checkbox" v-model="form.dimesso" /> Dimesso
      </label>
      <Button type="submit" label="Salva" />
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
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--steel);
  font-size: 0.8125rem;
  font-weight: 600;
}
</style>
