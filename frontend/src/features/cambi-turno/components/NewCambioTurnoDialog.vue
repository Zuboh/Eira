<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import FormField from '@/components/ui/FormField.vue'
import { dialogStyle } from '@/components/ui/dialogStyles'
import { formatTurnoCambio } from '@/features/cambi-turno/format'
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
    label: a.turno ? formatTurnoCambio(a.turno) : `Turno #${a.turno_id}`,
  })),
)

const assegnazioniCollegaConLabel = computed(() =>
  props.assegnazioniColleghi
    .filter(
      (assegnazione) => assegnazione.infermiere_id === form.value.collega_id,
    )
    .map((assegnazione) => ({
      ...assegnazione,
      label: assegnazione.turno
        ? formatTurnoCambio(assegnazione.turno)
        : `Turno #${assegnazione.turno_id}`,
    })),
)

function setCollega(collegaId: number | null) {
  form.value.collega_id = collegaId
  form.value.assegnazione_collega_id = null
}
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
          :model-value="form.collega_id"
          :options="colleghi"
          optionLabel="cognome"
          optionValue="id"
          placeholder="Seleziona collega"
          required
          @update:model-value="setCollega"
        />
      </FormField>
      <FormField label="Turno del collega" required>
        <Select
          v-model="form.assegnazione_collega_id"
          :options="assegnazioniCollegaConLabel"
          optionLabel="label"
          optionValue="id"
          :placeholder="
            form.collega_id === null
              ? 'Seleziona prima il collega'
              : 'Seleziona il turno offerto'
          "
          :disabled="form.collega_id === null"
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
