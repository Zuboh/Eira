import { computed, ref } from 'vue'
import { apiErrorMessage } from '@/api/apiError'
import { createVoceDiarioCedema } from '@/api/diarioCedema'
import {
  createConsegnaSbar,
  listConsegneSbar,
  updateConsegnaSbar,
} from '@/api/consegneSbar'
import { listPazienti } from '@/api/pazienti'
import { getMieAssegnazioni, listTurni } from '@/api/turni'
import { useAuthStore } from '@/stores/auth'
import { prioritaOptions } from '@/features/sbar/form'
import {
  createEmptyGenericConsegnaForm,
  createFormFromConsegnaSbar,
  toCedemaPayload,
  toSbarPayload,
  toSbarUpdatePayload,
  validateConsegnaForm,
} from '@/features/patient-chart/form'
import { buildScaffold } from '@/features/patient-chart/consegnaSections'
import { useConsegnaCopyForward } from '@/features/patient-chart/useConsegnaCopyForward'
import {
  buildAssegnazioneTurnoOptions,
  turnoIdForDate,
  type AssegnazioneTurnoOption,
} from '@/features/sbar/turnoOptions'
import type { GenericConsegnaForm } from '@/features/patient-chart/types'
import type { ConsegnaSbar, Paziente } from '@/features/sbar/types'

const PAGE_SIZE = 25

export function useConsegneSbar() {
  const auth = useAuthStore()

  const consegne = ref<ConsegnaSbar[]>([])
  const pazienti = ref<Paziente[]>([])
  const assegnazioni = ref<AssegnazioneTurnoOption[]>([])
  const loading = ref(false)
  const error = ref('')

  const page = ref(1)
  const total = ref(0)
  const pageCount = computed(() =>
    Math.max(1, Math.ceil(total.value / PAGE_SIZE)),
  )

  const dialogOpen = ref(false)
  const editingId = ref<number | null>(null)
  const saving = ref(false)
  const form = ref<GenericConsegnaForm>(createEmptyGenericConsegnaForm())

  // Errore del form consegna, separato da `error`: quello vive sulla pagina,
  // che mentre il dialog e' aperto sta sotto la mask modale.
  const formError = ref('')
  const copyForward = useConsegnaCopyForward({ form, error: formError })

  const pazientiById = computed(
    () => new Map(pazienti.value.map((p) => [p.id, p])),
  )
  const isEditing = computed(() => editingId.value !== null)
  const canCreateConsegna = computed(() => auth.ruolo === 'infermiere')

  function nomePaziente(id: number) {
    const p = pazientiById.value.get(id)
    return p ? `${p.cognome} ${p.nome}` : `#${id}`
  }

  function canEditConsegna(consegna: ConsegnaSbar) {
    return auth.user !== null && consegna.autore_id === auth.user.id
  }

  async function loadAssegnazioniIfNeeded() {
    if (auth.ruolo !== 'infermiere' || assegnazioni.value.length > 0) return

    const [assegnazioniResponse, turniResponse] = await Promise.all([
      getMieAssegnazioni(),
      listTurni(),
    ])
    assegnazioni.value = buildAssegnazioneTurnoOptions(
      assegnazioniResponse.data,
      turniResponse.data,
    )
  }

  async function load() {
    error.value = ''
    loading.value = true
    try {
      const [c, p] = await Promise.all([
        listConsegneSbar({
          skip: (page.value - 1) * PAGE_SIZE,
          limit: PAGE_SIZE,
        }),
        listPazienti(),
      ])
      consegne.value = c.data.items
      total.value = c.data.total
      pazienti.value = p.data
    } catch {
      error.value = 'Impossibile caricare le consegne SBAR.'
    } finally {
      loading.value = false
    }
  }

  async function goToPage(next: number) {
    page.value = Math.min(Math.max(1, next), pageCount.value)
    await load()
  }

  async function apriNuova() {
    formError.value = ''
    editingId.value = null
    copyForward.resetCopyForward()
    const emptyForm = createEmptyGenericConsegnaForm()
    form.value = { ...emptyForm, testo: buildScaffold(emptyForm.tipo) }
    dialogOpen.value = true
    try {
      await loadAssegnazioniIfNeeded()
      form.value.turno_id = turnoIdForDate(assegnazioni.value, form.value.data)
    } catch {
      formError.value = 'Impossibile caricare i turni assegnati.'
    }
  }

  function apriEdit(consegna: ConsegnaSbar) {
    formError.value = ''
    editingId.value = consegna.id
    copyForward.resetCopyForward()
    form.value = createFormFromConsegnaSbar(consegna)
    dialogOpen.value = true
  }

  async function salva() {
    const editId = editingId.value
    const pazienteId = form.value.paziente_id
    if (editId === null && pazienteId === null) {
      formError.value = 'Seleziona il paziente della consegna.'
      return
    }
    const invalid = validateConsegnaForm(form.value)
    if (invalid) {
      formError.value = invalid
      return
    }

    saving.value = true
    formError.value = ''
    try {
      if (editId !== null) {
        await updateConsegnaSbar(editId, toSbarUpdatePayload(form.value))
      } else if (pazienteId !== null) {
        if (form.value.tipo === 'sbar' && form.value.turno_id !== null) {
          await createConsegnaSbar(
            toSbarPayload(pazienteId, {
              ...form.value,
              turno_id: form.value.turno_id,
            }),
          )
        } else {
          await createVoceDiarioCedema(pazienteId, toCedemaPayload(form.value))
        }
      }
      dialogOpen.value = false
      await load()
    } catch (err) {
      formError.value = apiErrorMessage(err, 'Impossibile salvare la consegna.')
    } finally {
      saving.value = false
    }
  }

  return {
    consegne,
    pazienti,
    assegnazioni,
    loading,
    error,
    formError,
    dialogOpen,
    editingId,
    isEditing,
    saving,
    form,
    page,
    total,
    pageCount,
    prioritaOptions,
    canCreateConsegna,
    nomePaziente,
    canEditConsegna,
    loadAssegnazioniIfNeeded,
    load,
    goToPage,
    apriNuova,
    apriEdit,
    salva,
    ...copyForward,
  }
}
