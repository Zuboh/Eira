import { ref, unref, type MaybeRef, type Ref } from 'vue'
import { updatePaziente, type Paziente } from '@/api/pazienti'
import { createVoceDiarioCedema } from '@/api/diarioCedema'
import { createConley, createNorton } from '@/api/valutazioni'
import {
  createEmptyCedemaForm,
  createEmptyConleyForm,
  createEmptyNortonForm,
  createPatientEditForm,
} from '@/features/patient-chart/form'
import type {
  CedemaForm,
  ConleyForm,
  NortonForm,
  PatientEditForm,
} from '@/features/patient-chart/types'

type PatientChartDialogOptions = {
  pazienteId: MaybeRef<number>
  paziente: Ref<Paziente | null>
  error: Ref<string>
  reloadCedema: () => Promise<void>
  reloadValutazioni: () => Promise<void>
}

export function usePatientChartDialogs({
  pazienteId,
  paziente,
  error,
  reloadCedema,
  reloadValutazioni,
}: PatientChartDialogOptions) {
  const editing = ref(false)
  const editForm = ref<PatientEditForm>({
    letto: '',
    diagnosi_ingresso: '',
    dimesso: false,
  })

  const cedemaDialog = ref(false)
  const cedemaSaving = ref(false)
  const cedemaForm = ref<CedemaForm>(createEmptyCedemaForm())

  const nortonDialog = ref(false)
  const nortonSaving = ref(false)
  const nortonForm = ref<NortonForm>(createEmptyNortonForm())

  const conleyDialog = ref(false)
  const conleySaving = ref(false)
  const conleyForm = ref<ConleyForm>(createEmptyConleyForm())

  function apriEdit() {
    if (!paziente.value) return
    editForm.value = createPatientEditForm(paziente.value)
    editing.value = true
  }

  async function salvaEdit() {
    const { data } = await updatePaziente(unref(pazienteId), editForm.value)
    paziente.value = data
    editing.value = false
  }

  function apriCedema() {
    cedemaForm.value = createEmptyCedemaForm()
    cedemaDialog.value = true
  }

  async function salvaCedema() {
    cedemaSaving.value = true
    try {
      await createVoceDiarioCedema(unref(pazienteId), cedemaForm.value)
      cedemaDialog.value = false
      await reloadCedema()
    } catch {
      error.value = 'Impossibile salvare la voce diario.'
    } finally {
      cedemaSaving.value = false
    }
  }

  function apriNorton() {
    nortonForm.value = createEmptyNortonForm()
    nortonDialog.value = true
  }

  async function salvaNorton() {
    nortonSaving.value = true
    try {
      await createNorton(unref(pazienteId), nortonForm.value)
      nortonDialog.value = false
      await reloadValutazioni()
    } catch {
      error.value = 'Impossibile salvare la valutazione Norton.'
    } finally {
      nortonSaving.value = false
    }
  }

  function apriConley() {
    conleyForm.value = createEmptyConleyForm()
    conleyDialog.value = true
  }

  async function salvaConley() {
    conleySaving.value = true
    try {
      await createConley(unref(pazienteId), conleyForm.value)
      conleyDialog.value = false
      await reloadValutazioni()
    } catch {
      error.value = 'Impossibile salvare la valutazione Conley.'
    } finally {
      conleySaving.value = false
    }
  }

  return {
    editing,
    editForm,
    cedemaDialog,
    cedemaSaving,
    cedemaForm,
    nortonDialog,
    nortonSaving,
    nortonForm,
    conleyDialog,
    conleySaving,
    conleyForm,
    apriEdit,
    salvaEdit,
    apriCedema,
    salvaCedema,
    apriNorton,
    salvaNorton,
    apriConley,
    salvaConley,
  }
}
