<script setup lang="ts">
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import FormField from '@/components/ui/FormField.vue'
import { dialogStyle } from '@/components/ui/dialogStyles'
import type {
  CambioTurnoSubmitEmits,
  RifiutoCambioTurnoDialogProps,
} from '@/features/cambi-turno/types'

const visible = defineModel<boolean>('visible', { required: true })
const motivo = defineModel<string>('motivo', { required: true })

defineProps<RifiutoCambioTurnoDialogProps>()

const emit = defineEmits<CambioTurnoSubmitEmits>()
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="Motivo rifiuto"
    modal
    :style="dialogStyle.sm"
  >
    <form class="form" @submit.prevent="emit('save')">
      <FormField label="Motivo">
        <InputText v-model="motivo" />
      </FormField>
      <Button
        type="submit"
        label="Conferma rifiuto"
        severity="secondary"
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
