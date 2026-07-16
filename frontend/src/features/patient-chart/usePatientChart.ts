import { computed, ref, unref, type MaybeRef } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getPaziente, updatePaziente, type Paziente } from '@/api/pazienti'
import { getMieAssegnazioni, type AssegnazioneTurno } from '@/api/turni'
import {
  listDiarioCedema,
  createVoceDiarioCedema,
  type VoceDiarioCedema,
} from '@/api/diarioCedema'
import {
  getValutazioni,
  createNorton,
  createConley,
  type ValutazioneNorton,
  type ValutazioneConley,
} from '@/api/valutazioni'
import { listConsegneSbar, type ConsegnaSbar } from '@/api/consegneSbar'
import {
  createEmptyCedemaForm,
  createEmptyConleyForm,
  createEmptyNortonForm,
  createPatientEditForm,
} from '@/features/patient-chart/form'
import type { CedemaForm, ConleyForm, NortonForm, PatientEditForm } from '@/features/patient-chart/types'

export function usePatientChart(pazienteId: MaybeRef<number>) {
  const auth = useAuthStore()
  const currentPazienteId = computed(() => unref(pazienteId))

  const paziente = ref<Paziente | null>(null)
  const error = ref('')
  const loading = ref(false)

  const cedema = ref<VoceDiarioCedema[]>([])
  const norton = ref<ValutazioneNorton[]>([])
  const conley = ref<ValutazioneConley[]>([])
  const consegne = ref<ConsegnaSbar[]>([])
  const consegneLoaded = ref(false)
  const assegnazioni = ref<AssegnazioneTurno[]>([])

  const editing = ref(false)
  const editForm = ref<PatientEditForm>({ letto: '', diagnosi_ingresso: '', dimesso: false })

  const cedemaDialog = ref(false)
  const cedemaSaving = ref(false)
  const cedemaForm = ref<CedemaForm>(createEmptyCedemaForm())

  const nortonDialog = ref(false)
  const nortonSaving = ref(false)
  const nortonForm = ref<NortonForm>(createEmptyNortonForm())

  const conleyDialog = ref(false)
  const conleySaving = ref(false)
  const conleyForm = ref<ConleyForm>(createEmptyConleyForm())

  const canEditPatient = computed(() => auth.ruolo === 'caposala')
  const canCreateClinicalEntries = computed(() => auth.ruolo === 'infermiere')

  async function load() {
    error.value = ''
    loading.value = true
    try {
      const [p, d, v] = await Promise.all([
        getPaziente(currentPazienteId.value),
        listDiarioCedema(currentPazienteId.value),
        getValutazioni(currentPazienteId.value),
      ])
      paziente.value = p.data
      cedema.value = d.data
      norton.value = v.data.norton
      conley.value = v.data.conley
      if (auth.ruolo === 'infermiere') {
        const a = await getMieAssegnazioni()
        assegnazioni.value = a.data
      }
    } catch {
      error.value = 'Impossibile caricare la scheda paziente.'
    } finally {
      loading.value = false
    }
  }

  async function loadConsegneSbar() {
    if (consegneLoaded.value) return

    try {
      const { data } = await listConsegneSbar()
      consegne.value = data.filter((c) => c.paziente_id === currentPazienteId.value)
      consegneLoaded.value = true
    } catch {
      error.value = 'Impossibile caricare lo storico SBAR.'
      throw new Error(error.value)
    }
  }

  function apriEdit() {
    if (!paziente.value) return
    editForm.value = createPatientEditForm(paziente.value)
    editing.value = true
  }

  async function salvaEdit() {
    const { data } = await updatePaziente(currentPazienteId.value, editForm.value)
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
      await createVoceDiarioCedema(currentPazienteId.value, cedemaForm.value)
      cedemaDialog.value = false
      const { data } = await listDiarioCedema(currentPazienteId.value)
      cedema.value = data
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
      await createNorton(currentPazienteId.value, nortonForm.value)
      nortonDialog.value = false
      const { data } = await getValutazioni(currentPazienteId.value)
      norton.value = data.norton
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
      await createConley(currentPazienteId.value, conleyForm.value)
      conleyDialog.value = false
      const { data } = await getValutazioni(currentPazienteId.value)
      conley.value = data.conley
    } catch {
      error.value = 'Impossibile salvare la valutazione Conley.'
    } finally {
      conleySaving.value = false
    }
  }

  return {
    paziente,
    error,
    loading,
    cedema,
    norton,
    conley,
    consegne,
    consegneLoaded,
    assegnazioni,
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
    canEditPatient,
    canCreateClinicalEntries,
    load,
    loadConsegneSbar,
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
