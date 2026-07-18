<script setup lang="ts">
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Select from 'primevue/select'
import { dialogStyle } from '@/components/ui/dialogStyles'
import FormField from '@/components/ui/FormField.vue'
import { ruoloOptions } from '@/features/staff/constants'
import type { NewStaffDialogProps, NewStaffForm, StaffDialogEmits } from '@/features/staff/types'

const visible = defineModel<boolean>('visible', { required: true })
const form = defineModel<NewStaffForm>('form', { required: true })

defineProps<NewStaffDialogProps>()

const emit = defineEmits<StaffDialogEmits>()
</script>

<template>
  <Dialog v-model:visible="visible" header="Aggiungi utente" modal :style="dialogStyle.md">
    <form class="form" @submit.prevent="emit('save')">
      <FormField label="Nome" forId="staff-nome" required>
        <InputText id="staff-nome" v-model="form.nome" required />
      </FormField>
      <FormField label="Cognome" forId="staff-cognome" required>
        <InputText id="staff-cognome" v-model="form.cognome" required />
      </FormField>
      <FormField label="Email" forId="staff-email" required>
        <InputText id="staff-email" v-model="form.email" type="email" required />
      </FormField>
      <FormField label="Password" forId="staff-password" required>
        <Password inputId="staff-password" v-model="form.password" toggleMask :feedback="false" required />
      </FormField>
      <FormField label="Ruolo" required>
        <Select v-model="form.ruolo" :options="ruoloOptions" optionLabel="label" optionValue="value" />
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
