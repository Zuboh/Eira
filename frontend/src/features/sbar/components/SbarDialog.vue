<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import { dialogStyle } from '@/components/ui/dialogStyles'
import FormField from '@/components/ui/FormField.vue'
import { prioritaOptions, validateSbarForm } from '@/features/sbar/form'
import type {
  AssegnazioneTurno,
  ConsegnaSbarForm,
  Paziente,
  SbarFormErrors,
} from '@/features/sbar/types'

const visible = defineModel<boolean>('visible', { required: true })
const form = defineModel<ConsegnaSbarForm>('form', { required: true })

const props = withDefaults(
  defineProps<{
    isEditing: boolean
    saving: boolean
    assegnazioni: AssegnazioneTurno[]
    pazienti?: Paziente[]
    hidePaziente?: boolean
  }>(),
  {
    pazienti: () => [],
    hidePaziente: false,
  },
)

const emit = defineEmits<{
  save: []
}>()

const errors = ref<SbarFormErrors>({})
const showPaziente = computed(() => !props.isEditing && !props.hidePaziente)
const showTurno = computed(() => !props.isEditing)

watch(visible, (isVisible) => {
  if (!isVisible) errors.value = {}
})

function submit() {
  errors.value = validateSbarForm(form.value, {
    checkPazienteTurno: !props.isEditing,
  })
  if (Object.keys(errors.value).length > 0) return

  emit('save')
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :header="isEditing ? 'Modifica consegna' : 'Nuova consegna'"
    modal
    :style="dialogStyle.lg"
  >
    <form class="form" novalidate @submit.prevent="submit">
      <FormField
        v-if="showPaziente"
        label="Paziente"
        required
        :error="errors.paziente_id"
      >
        <Select
          v-model="form.paziente_id"
          :options="pazienti"
          optionLabel="cognome"
          optionValue="id"
          placeholder="Seleziona paziente"
        />
      </FormField>
      <FormField
        v-if="showTurno"
        label="Turno"
        required
        :error="errors.turno_id"
      >
        <Select
          v-model="form.turno_id"
          :options="assegnazioni"
          optionLabel="turno_id"
          optionValue="turno_id"
          placeholder="Seleziona turno"
        />
      </FormField>
      <FormField label="Priorità">
        <Select
          v-model="form.priorita"
          :options="prioritaOptions"
          optionLabel="label"
          optionValue="value"
        />
      </FormField>
      <FormField label="Situation" required :error="errors.situation">
        <Textarea v-model="form.situation" rows="2" />
      </FormField>
      <FormField label="Background" required :error="errors.background">
        <Textarea v-model="form.background" rows="2" />
      </FormField>
      <FormField label="Assessment" required :error="errors.assessment">
        <Textarea v-model="form.assessment" rows="2" />
      </FormField>
      <FormField label="Recommendation" required :error="errors.recommendation">
        <Textarea v-model="form.recommendation" rows="2" />
      </FormField>
      <Button type="submit" label="Salva" :loading="saving" />
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
