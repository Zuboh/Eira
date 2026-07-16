<script setup lang="ts">
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import FormField from '@/components/ui/FormField.vue'
import { dialogStyle } from '@/components/ui/dialogStyles'
import type { CambioTurnoForm, CambioTurnoSubmitEmits, NewCambioTurnoDialogProps } from '@/features/cambi-turno/types'

const visible = defineModel<boolean>('visible', { required: true })
const form = defineModel<CambioTurnoForm>('form', { required: true })

defineProps<NewCambioTurnoDialogProps>()

const emit = defineEmits<CambioTurnoSubmitEmits>()
</script>

<template>
  <Dialog v-model:visible="visible" header="Richiedi cambio turno" modal :style="dialogStyle.sm">
    <form class="form" @submit.prevent="emit('save')">
      <FormField label="Tuo turno" required>
        <Select
          v-model="form.assegnazione_turno_id"
          :options="assegnazioni"
          optionLabel="turno_id"
          optionValue="id"
          placeholder="Seleziona assegnazione"
          required
        />
      </FormField>
      <FormField label="Collega" required>
        <Select
          v-model="form.collega_id"
          :options="colleghi"
          optionLabel="cognome"
          optionValue="id"
          placeholder="Seleziona collega"
          required
        />
      </FormField>
      <Button type="submit" label="Invia richiesta" :loading="saving" />
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
