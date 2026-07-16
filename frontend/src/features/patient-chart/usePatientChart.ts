import { computed, ref, unref, type MaybeRef } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getPaziente, updatePaziente, type Paziente, type PazienteUpdatePayload } from '@/api/pazienti'
import { getMieAssegnazioni, type AssegnazioneTurno } from '@/api/turni'
import {
  listDiarioCedema,
  createVoceDiarioCedema,
  type VoceDiarioCedema,
  type VoceDiarioCedemaCreatePayload,
} from '@/api/diarioCedema'
import {
  getValutazioni,
  createNorton,
  createConley,
  type ValutazioneNorton,
  type ValutazioneNortonCreatePayload,
  type ValutazioneConley,
  type ValutazioneConleyCreatePayload,
} from '@/api/valutazioni'
import { listConsegneSbar, type ConsegnaSbar } from '@/api/consegneSbar'

type CedemaForm = VoceDiarioCedemaCreatePayload
type NortonForm = ValutazioneNortonCreatePayload
type ConleyForm = ValutazioneConleyCreatePayload

type EditForm = Required<Pick<PazienteUpdatePayload, 'letto' | 'diagnosi_ingresso' | 'dimesso'>>

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function createEmptyCedemaForm(): CedemaForm {
  return {
    turno_id: null,
    coscienza: '',
    emotivita: '',
    dolore: '',
    emodinamica: '',
    mobilizzazione: '',
    allert: '',
  }
}

function createEmptyNortonForm(): NortonForm {
  return {
    data_valutazione: todayIsoDate(),
    condizioni_generali: 1,
    stato_mentale: 1,
    attivita: 1,
    mobilita: 1,
    incontinenza: 1,
  }
}

function createEmptyConleyForm(): ConleyForm {
  return {
    data_valutazione: todayIsoDate(),
    storia_cadute: 0,
    deficit_visivo: 0,
    alterazione_eliminazione: 0,
    agitazione: 0,
    deficit_vista_osservato: 0,
    andatura_alterata: 0,
  }
}

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
  const editForm = ref<EditForm>({ letto: '', diagnosi_ingresso: '', dimesso: false })

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
    editForm.value = {
      letto: paziente.value.letto,
      diagnosi_ingresso: paziente.value.diagnosi_ingresso,
      dimesso: paziente.value.dimesso,
    }
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
