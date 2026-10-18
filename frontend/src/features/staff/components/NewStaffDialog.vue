<script setup lang="ts">
import InlineError from '@/components/ui/InlineError.vue'
import { watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Select from 'primevue/select'
import { dialogStyle } from '@/components/ui/dialogStyles'
import FormField from '@/components/ui/FormField.vue'
import AvatarFilePicker from '@/features/staff/components/AvatarFilePicker.vue'
import { ruoloOptions } from '@/features/staff/constants'
import type {
  NewStaffDialogProps,
  NewStaffForm,
  StaffDialogEmits,
} from '@/features/staff/types'

const visible = defineModel<boolean>('visible', { required: true })
const form = defineModel<NewStaffForm>('form', { required: true })
const avatarFile = defineModel<File | null>('avatarFile', { required: true })

defineProps<NewStaffDialogProps>()

const emit = defineEmits<StaffDialogEmits>()

watch(visible, (isVisible) => {
  if (!isVisible) avatarFile.value = null
})
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="Aggiungi utente"
    modal
    :style="dialogStyle.md"
  >
    <form class="form" @submit.prevent="emit('save')">
      <InlineError :message="error" />
      <FormField
        v-slot="{ fieldAttrs }"
        label="Nome"
        forId="staff-nome"
        required
      >
        <InputText
          v-bind="fieldAttrs"
          id="staff-nome"
          v-model="form.nome"
          required
        />
      </FormField>
      <FormField
        v-slot="{ fieldAttrs }"
        label="Cognome"
        forId="staff-cognome"
        required
      >
        <InputText
          v-bind="fieldAttrs"
          id="staff-cognome"
          v-model="form.cognome"
          required
        />
      </FormField>
      <FormField
        v-slot="{ fieldAttrs }"
        label="Email"
        forId="staff-email"
        required
      >
        <InputText
          v-bind="fieldAttrs"
          id="staff-email"
          v-model="form.email"
          type="email"
          required
        />
      </FormField>
      <FormField
        v-slot="{ fieldAttrs }"
        label="Password"
        forId="staff-password"
        required
      >
        <Password
          v-model="form.password"
          :input-props="fieldAttrs"
          inputId="staff-password"
          toggleMask
          :feedback="false"
          required
        >
          <template #maskicon="{ toggleCallback }">
            <Button
              class="eira-password-toggle"
              type="button"
              icon="pi pi-eye-slash"
              text
              severity="secondary"
              aria-label="Nascondi password"
              @click="toggleCallback"
            />
          </template>
          <template #unmaskicon="{ toggleCallback }">
            <Button
              class="eira-password-toggle"
              type="button"
              icon="pi pi-eye"
              text
              severity="secondary"
              aria-label="Mostra password"
              @click="toggleCallback"
            />
          </template>
        </Password>
      </FormField>
      <FormField
        v-slot="{ fieldAttrs }"
        label="Ruolo"
        forId="staff-ruolo"
        required
      >
        <Select
          v-model="form.ruolo"
          :pt="{ label: fieldAttrs }"
          inputId="staff-ruolo"
          :options="ruoloOptions"
          optionLabel="label"
          optionValue="value"
        />
      </FormField>
      <FormField label="Foto profilo (opzionale)" forId="staff-avatar">
        <AvatarFilePicker v-model="avatarFile" :disabled="saving" />
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
</style>
