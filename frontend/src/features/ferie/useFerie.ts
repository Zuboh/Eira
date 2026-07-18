import { computed, ref } from 'vue'
import {
  createRichiestaFerie,
  deleteRichiestaFerie,
  listRichiesteFerie,
  listSlotFerieDisponibili,
  rispondiFerie,
  updateRichiestaFerie,
  type RichiestaFerie,
} from '@/api/ferie'
import { listUtenti, type Utente } from '@/api/utenti'
import { useAuthStore } from '@/stores/auth'

const STATI_ATTIVI = ['in_attesa', 'approvata']

export function useFerie() {
  const auth = useAuthStore()

  const richieste = ref<RichiestaFerie[]>([])
  const slotDisponibili = ref<string[]>([])
  const utenti = ref<Utente[]>([])
  const loading = ref(false)
  const error = ref('')

  const preferenzeSelezionate = ref<(string | null)[]>([null])
  const editingId = ref<number | null>(null)
  const saving = ref(false)

  const rifiutoDialog = ref(false)
  const rifiutoTarget = ref<RichiestaFerie | null>(null)
  const motivoRifiuto = ref('')

  const approvaDialog = ref(false)
  const approvaTarget = ref<RichiestaFerie | null>(null)

  const utentiById = computed(() => new Map(utenti.value.map((u) => [u.id, u])))
  const currentRole = computed(() => auth.ruolo)

  const mieRichieste = computed(() =>
    richieste.value.filter((r) => r.infermiere_id === auth.user?.id),
  )
  const richiestaAttiva = computed(() =>
    mieRichieste.value.find((r) => STATI_ATTIVI.includes(r.stato)),
  )
  const canRequestFerie = computed(
    () => auth.ruolo === 'infermiere' && !richiestaAttiva.value,
  )

  function nomeUtente(id: number) {
    const u = utentiById.value.get(id)
    return u ? `${u.cognome} ${u.nome}` : `#${id}`
  }

  async function load() {
    error.value = ''
    loading.value = true
    try {
      const [r, s, u] = await Promise.all([
        listRichiesteFerie(),
        listSlotFerieDisponibili(),
        listUtenti(),
      ])
      richieste.value = r.data
      slotDisponibili.value = s.data
      utenti.value = u.data
    } catch (err) {
      console.error('Impossibile caricare le richieste di ferie.', err)
      error.value = 'Impossibile caricare le richieste di ferie.'
    } finally {
      loading.value = false
    }
  }

  function resetForm() {
    preferenzeSelezionate.value = [null]
    editingId.value = null
  }

  function aggiungiPreferenza() {
    if (preferenzeSelezionate.value.length < 3) {
      preferenzeSelezionate.value.push(null)
    }
  }

  function rimuoviPreferenza(index: number) {
    preferenzeSelezionate.value.splice(index, 1)
  }

  function avviaModifica(richiesta: RichiestaFerie) {
    editingId.value = richiesta.id
    preferenzeSelezionate.value = richiesta.preferenze
      .slice()
      .sort((a, b) => a.rank - b.rank)
      .map((p) => p.data_inizio)
  }

  async function salva() {
    const preferenze = preferenzeSelezionate.value.filter((p): p is string => p !== null)
    if (preferenze.length === 0) return
    error.value = ''
    saving.value = true
    try {
      if (editingId.value !== null) {
        await updateRichiestaFerie(editingId.value, { preferenze })
      } else {
        await createRichiestaFerie({ preferenze })
      }
      resetForm()
      await load()
    } catch {
      error.value = 'Impossibile salvare la richiesta di ferie.'
    } finally {
      saving.value = false
    }
  }

  async function cancella(richiesta: RichiestaFerie) {
    error.value = ''
    try {
      await deleteRichiestaFerie(richiesta.id)
      if (editingId.value === richiesta.id) resetForm()
      await load()
    } catch {
      error.value = 'Impossibile annullare la richiesta.'
    }
  }

  function apriApprova(richiesta: RichiestaFerie) {
    approvaTarget.value = richiesta
    approvaDialog.value = true
  }

  async function confermaApprova(preferenzaRank: number) {
    if (!approvaTarget.value) return
    error.value = ''
    try {
      await rispondiFerie(approvaTarget.value.id, {
        accetta: true,
        preferenza_rank: preferenzaRank,
      })
      approvaDialog.value = false
      await load()
    } catch {
      error.value = 'Impossibile approvare la richiesta.'
    }
  }

  function apriRifiuto(richiesta: RichiestaFerie) {
    rifiutoTarget.value = richiesta
    motivoRifiuto.value = ''
    rifiutoDialog.value = true
  }

  async function confermaRifiuto() {
    if (!rifiutoTarget.value) return
    error.value = ''
    try {
      await rispondiFerie(rifiutoTarget.value.id, {
        accetta: false,
        motivo_rifiuto: motivoRifiuto.value,
      })
      rifiutoDialog.value = false
      await load()
    } catch {
      error.value = 'Impossibile rifiutare la richiesta.'
    }
  }

  return {
    richieste,
    slotDisponibili,
    loading,
    error,
    preferenzeSelezionate,
    editingId,
    saving,
    canRequestFerie,
    currentRole,
    rifiutoDialog,
    motivoRifiuto,
    approvaDialog,
    approvaTarget,
    nomeUtente,
    load,
    aggiungiPreferenza,
    rimuoviPreferenza,
    avviaModifica,
    resetForm,
    salva,
    cancella,
    apriApprova,
    confermaApprova,
    apriRifiuto,
    confermaRifiuto,
  }
}
