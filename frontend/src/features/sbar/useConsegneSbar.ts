import { computed, ref } from 'vue'
import { createConsegnaSbar, listConsegneSbar, updateConsegnaSbar } from '@/api/consegneSbar'
import { listPazienti } from '@/api/pazienti'
import { getMieAssegnazioni } from '@/api/turni'
import { useAuthStore } from '@/stores/auth'
import {
  canCreateConsegnaPayload,
  createEmptyConsegnaSbarForm,
  createFormFromConsegna,
  prioritaOptions,
  toCreateConsegnaPayload,
  toUpdateConsegnaPayload,
} from '@/features/sbar/form'
import type { AssegnazioneTurno, ConsegnaSbar, Paziente } from '@/features/sbar/types'

const PAGE_SIZE = 25

export function useConsegneSbar() {
  const auth = useAuthStore()

  const consegne = ref<ConsegnaSbar[]>([])
  const pazienti = ref<Paziente[]>([])
  const assegnazioni = ref<AssegnazioneTurno[]>([])
  const loading = ref(false)
  const error = ref('')

  const page = ref(1)
  const total = ref(0)
  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))

  const dialogOpen = ref(false)
  const editingId = ref<number | null>(null)
  const saving = ref(false)
  const form = ref(createEmptyConsegnaSbarForm())

  const pazientiById = computed(() => new Map(pazienti.value.map((p) => [p.id, p])))
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

    const { data } = await getMieAssegnazioni()
    assegnazioni.value = data
  }

  async function load() {
    error.value = ''
    loading.value = true
    try {
      const [c, p] = await Promise.all([
        listConsegneSbar({ skip: (page.value - 1) * PAGE_SIZE, limit: PAGE_SIZE }),
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
    form.value = createEmptyConsegnaSbarForm()
    dialogOpen.value = true
    try {
      await loadAssegnazioniIfNeeded()
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
    saving.value = true
    error.value = ''
    try {
      if (editingId.value !== null) {
        await updateConsegnaSbar(editingId.value, toUpdateConsegnaPayload(form.value))
      } else {
        if (!canCreateConsegnaPayload(form.value)) return
        await createConsegnaSbar(toCreateConsegnaPayload(form.value))
      }
      dialogOpen.value = false
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
  }
}
