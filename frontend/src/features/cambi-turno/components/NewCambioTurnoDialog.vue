<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import FormField from '@/components/ui/FormField.vue'
import { dialogStyle } from '@/components/ui/dialogStyles'
import { TIPO_TURNO_LABEL } from '@/features/turni/constants'
import { formatDateShortIt } from '@/utils/dateFormat'
import type {
  CambioTurnoForm,
  CambioTurnoSubmitEmits,
  NewCambioTurnoDialogProps,
} from '@/features/cambi-turno/types'

const visible = defineModel<boolean>('visible', { required: true })
const form = defineModel<CambioTurnoForm>('form', { required: true })

const props = defineProps<NewCambioTurnoDialogProps>()

const emit = defineEmits<CambioTurnoSubmitEmits>()

const assegnazioniConLabel = computed(() =>
  props.assegnazioni.map((a) => ({
    ...a,
    label: a.turno
      ? `${formatDateShortIt(a.turno.data)} · ${TIPO_TURNO_LABEL[a.turno.tipo]}`
      : `Turno #${a.turno_id}`,
  })),
)
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="Richiedi cambio turno"
    modal
    :style="dialogStyle.sm"
  >
    <form class="form" @submit.prevent="emit('save')">
      <FormField label="Tuo turno" required>
        <Select
          v-model="form.assegnazione_turno_id"
          :options="assegnazioniConLabel"
          optionLabel="label"
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
