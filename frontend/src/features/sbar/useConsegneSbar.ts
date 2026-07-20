import { computed, ref } from 'vue'
import { createVoceDiarioCedema } from '@/api/diarioCedema'
import {
  createConsegnaSbar,
  listConsegneSbar,
  updateConsegnaSbar,
} from '@/api/consegneSbar'
import { listPazienti } from '@/api/pazienti'
import { getMieAssegnazioni, listTurni } from '@/api/turni'
import { useAuthStore } from '@/stores/auth'
import {
  createEmptyConsegnaSbarForm,
  createFormFromConsegna,
  prioritaOptions,
  toUpdateConsegnaPayload,
} from '@/features/sbar/form'
import {
  buildClinicalInsight,
  createEmptyGenericConsegnaForm,
  toCedemaPayload,
  toSbarPayload,
} from '@/features/patient-chart/form'
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
  const nuovaDialogOpen = ref(false)
  const editingId = ref<number | null>(null)
  const saving = ref(false)
  const form = ref(createEmptyConsegnaSbarForm())
  const nuovaForm = ref<GenericConsegnaForm>(createEmptyGenericConsegnaForm())
  const nuovaInsight = computed(() =>
    buildClinicalInsight(nuovaForm.value.testo, nuovaForm.value.tipo),
  )

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
    editingId.value = null
    nuovaForm.value = createEmptyGenericConsegnaForm()
    nuovaDialogOpen.value = true
    try {
      await loadAssegnazioniIfNeeded()
      nuovaForm.value.turno_id = turnoIdForDate(
        assegnazioni.value,
        nuovaForm.value.data,
      )
    } catch {
      error.value = 'Impossibile caricare i turni assegnati.'
    }
  }

  function apriEdit(consegna: ConsegnaSbar) {
    editingId.value = consegna.id
    form.value = createFormFromConsegna(consegna)
    dialogOpen.value = true
  }

  async function salva() {
    if (editingId.value === null) return

    saving.value = true
    error.value = ''
    try {
      await updateConsegnaSbar(
        editingId.value,
        toUpdateConsegnaPayload(form.value),
      )
      dialogOpen.value = false
      await load()
    } catch {
      error.value = 'Impossibile salvare la consegna.'
    } finally {
      saving.value = false
    }
  }

  async function salvaNuova() {
    const pazienteId = nuovaForm.value.paziente_id
    const testo = nuovaForm.value.testo.trim()
    if (pazienteId === null || !testo) return
    if (nuovaForm.value.tipo === 'sbar' && nuovaForm.value.turno_id === null)
      return

    saving.value = true
    error.value = ''
    try {
      if (
        nuovaForm.value.tipo === 'sbar' &&
        nuovaForm.value.turno_id !== null
      ) {
        await createConsegnaSbar(
          toSbarPayload(pazienteId, {
            ...nuovaForm.value,
            turno_id: nuovaForm.value.turno_id,
          }),
        )
      } else {
        await createVoceDiarioCedema(
          pazienteId,
          toCedemaPayload(nuovaForm.value),
        )
      }
      nuovaDialogOpen.value = false
      await load()
    } catch {
      error.value = 'Impossibile salvare la consegna.'
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
    dialogOpen,
    nuovaDialogOpen,
    editingId,
    isEditing,
    saving,
    form,
    nuovaForm,
    nuovaInsight,
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
    salvaNuova,
  }
}
