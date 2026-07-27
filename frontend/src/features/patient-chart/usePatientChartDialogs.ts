import { ref, unref, type MaybeRef, type Ref } from 'vue'
import { apiErrorMessage } from '@/api/apiError'
import { updatePaziente, type Paziente } from '@/api/pazienti'
import { createVoceDiarioCedema } from '@/api/diarioCedema'
import { createConsegnaSbar } from '@/api/consegneSbar'
import { createParametriVitali } from '@/api/parametriVitali'
import { createConley, createNorton } from '@/api/valutazioni'
import { turnoIdForDate } from '@/features/sbar/turnoOptions'
import type { AssegnazioneTurnoOption } from '@/features/sbar/turnoOptions'
import {
  createEmptyConleyForm,
  createEmptyGenericConsegnaForm,
  createEmptyNortonForm,
  createEmptyParametriVitaliForm,
  createPatientEditForm,
  toCedemaPayload,
  toSbarPayload,
  validateConsegnaForm,
} from '@/features/patient-chart/form'
import { buildScaffold } from '@/features/patient-chart/consegnaSections'
import { useConsegnaCopyForward } from '@/features/patient-chart/useConsegnaCopyForward'
import type {
  ConleyForm,
  GenericConsegnaForm,
  NortonForm,
  ParametriVitaliForm,
  PatientEditForm,
} from '@/features/patient-chart/types'

type PatientChartDialogOptions = {
  pazienteId: MaybeRef<number>
  paziente: Ref<Paziente | null>
  error: Ref<string>
  assegnazioni: Ref<AssegnazioneTurnoOption[]>
  reloadTimeline: () => Promise<void>
  reloadValutazioni: () => Promise<void>
  reloadParametriVitali: () => Promise<void>
}

export function usePatientChartDialogs({
  pazienteId,
  paziente,
  error,
  assegnazioni,
  reloadTimeline,
  reloadValutazioni,
  reloadParametriVitali,
}: PatientChartDialogOptions) {
  const editing = ref(false)
  const editForm = ref<PatientEditForm>({
    letto: '',
    diagnosi_ingresso: '',
    dimesso: false,
  })

  const consegnaDrawer = ref(false)
  const consegnaSaving = ref(false)
  const consegnaForm = ref<GenericConsegnaForm>(
    createEmptyGenericConsegnaForm(),
  )
  // Vedi useConsegneSbar: l'errore del form non puo' stare sulla pagina,
  // la mask del dialog lo copre.
  const consegnaError = ref('')
  const copyForward = useConsegnaCopyForward({
    form: consegnaForm,
    error: consegnaError,
  })

  const nortonDialog = ref(false)
  const nortonSaving = ref(false)
  const nortonForm = ref<NortonForm>(createEmptyNortonForm())

  const conleyDialog = ref(false)
  const conleySaving = ref(false)
  const conleyForm = ref<ConleyForm>(createEmptyConleyForm())

  const parametriDialog = ref(false)
  const parametriSaving = ref(false)
  const parametriForm = ref<ParametriVitaliForm>(
    createEmptyParametriVitaliForm(),
  )

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

  function apriConsegna() {
    consegnaError.value = ''
    copyForward.resetCopyForward()
    const emptyForm = createEmptyGenericConsegnaForm()
    consegnaForm.value = {
      ...emptyForm,
      paziente_id: unref(pazienteId),
      turno_id: turnoIdForDate(assegnazioni.value, emptyForm.data),
      testo: buildScaffold(emptyForm.tipo),
    }
    consegnaDrawer.value = true
  }

  async function salvaConsegna() {
    const invalid = validateConsegnaForm(consegnaForm.value)
    if (invalid) {
      consegnaError.value = invalid
      return
    }

    consegnaSaving.value = true
    consegnaError.value = ''
    try {
      if (
        consegnaForm.value.tipo === 'sbar' &&
        consegnaForm.value.turno_id !== null
      ) {
        await createConsegnaSbar(
          toSbarPayload(unref(pazienteId), {
            ...consegnaForm.value,
            turno_id: consegnaForm.value.turno_id,
          }),
        )
      } else {
        await createVoceDiarioCedema(
          unref(pazienteId),
          toCedemaPayload(consegnaForm.value),
        )
      }
      consegnaDrawer.value = false
      await reloadTimeline()
    } catch (err) {
      consegnaError.value = apiErrorMessage(
        err,
        'Impossibile salvare la consegna.',
      )
    } finally {
      consegnaSaving.value = false
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

  function apriParametri() {
    parametriForm.value = createEmptyParametriVitaliForm()
    parametriDialog.value = true
  }

  async function salvaParametri() {
    parametriSaving.value = true
    try {
      await createParametriVitali(unref(pazienteId), parametriForm.value)
      parametriDialog.value = false
      await reloadParametriVitali()
    } catch {
      error.value = 'Impossibile salvare i parametri vitali.'
    } finally {
      parametriSaving.value = false
    }
  }

  return {
    editing,
    editForm,
    consegnaDrawer,
    consegnaSaving,
    consegnaError,
    consegnaForm,
    nortonDialog,
    nortonSaving,
    nortonForm,
    conleyDialog,
    conleySaving,
    conleyForm,
    parametriDialog,
    parametriSaving,
    parametriForm,
    apriEdit,
    salvaEdit,
    apriConsegna,
    salvaConsegna,
    apriNorton,
    salvaNorton,
    apriConley,
    salvaConley,
    apriParametri,
    salvaParametri,
    ...copyForward,
  }
}
