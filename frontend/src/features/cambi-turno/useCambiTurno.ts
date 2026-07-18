import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  createRichiestaCambioTurno,
  deleteCambioTurno,
  listCambiTurno,
  rispondiCaposala,
  rispondiCollega,
  type RichiestaCambioTurno,
} from '@/api/cambiTurno'
import { getMieAssegnazioni, type AssegnazioneTurno } from '@/api/turni'
import { listUtenti, type Utente } from '@/api/utenti'
import { createEmptyCambioTurnoForm, toCambioTurnoCreatePayload } from '@/features/cambi-turno/form'

type RefreshAfterMutation = () => void | Promise<void>

type UseCambiTurnoOptions = {
  refreshAfterMutation?: RefreshAfterMutation
}

export function useCambiTurno(options: UseCambiTurnoOptions = {}) {
  const auth = useAuthStore()

  const richieste = ref<RichiestaCambioTurno[]>([])
  const utenti = ref<Utente[]>([])
  const assegnazioni = ref<AssegnazioneTurno[]>([])
  const loading = ref(false)
  const error = ref('')

  const dialogOpen = ref(false)
  const saving = ref(false)
  const form = ref(createEmptyCambioTurnoForm())

  const rifiutoDialog = ref(false)
  const rifiutoTarget = ref<RichiestaCambioTurno | null>(null)
  const motivoRifiuto = ref('')

  const utentiById = computed(() => new Map(utenti.value.map((u) => [u.id, u])))

  const colleghi = computed(() =>
    utenti.value.filter((u) => u.ruolo === 'infermiere' && u.id !== auth.user?.id),
  )
  const currentRole = computed(() => auth.ruolo)
  const currentUserId = computed(() => auth.user?.id ?? null)
  const canRequestChange = computed(() => auth.ruolo === 'infermiere')

  function setRichieste(nextRichieste: RichiestaCambioTurno[]) {
    richieste.value = nextRichieste
  }

  function setUtenti(nextUtenti: Utente[]) {
    utenti.value = nextUtenti
  }

  function nomeUtente(id: number) {
    const u = utentiById.value.get(id)
    return u ? `${u.cognome} ${u.nome}` : `#${id}`
  }

  async function load() {
    error.value = ''
    loading.value = true
    try {
      const [r, u] = await Promise.all([listCambiTurno(), listUtenti()])
      richieste.value = r.data
      utenti.value = u.data
      if (auth.ruolo === 'infermiere') {
        const a = await getMieAssegnazioni()
        assegnazioni.value = a.data
      }
    } catch (err) {
      console.error('Impossibile caricare le richieste di cambio turno.', err)
      error.value = 'Impossibile caricare le richieste di cambio turno.'
    } finally {
      loading.value = false
    }
  }

  async function refreshAfterMutation() {
    if (options.refreshAfterMutation) {
      await options.refreshAfterMutation()
      return
    }

    await load()
  }

  function apriNuova() {
    form.value = createEmptyCambioTurnoForm()
    dialogOpen.value = true
  }

  async function salva() {
    const payload = toCambioTurnoCreatePayload(form.value)
    if (!payload) return

    saving.value = true
    error.value = ''
    try {
      await createRichiestaCambioTurno(payload)
      dialogOpen.value = false
      await refreshAfterMutation()
    } catch {
      error.value = 'Impossibile creare la richiesta.'
    } finally {
      saving.value = false
    }
  }

  async function rispondiComeCollega(r: RichiestaCambioTurno, accetta: boolean) {
    error.value = ''
    try {
      await rispondiCollega(r.id, { accetta })
      await refreshAfterMutation()
    } catch {
      error.value = 'Impossibile rispondere alla richiesta.'
    }
  }

  function apriRifiuto(r: RichiestaCambioTurno) {
    rifiutoTarget.value = r
    motivoRifiuto.value = ''
    rifiutoDialog.value = true
  }

  async function approvaCaposala(r: RichiestaCambioTurno) {
    error.value = ''
    try {
      await rispondiCaposala(r.id, { accetta: true })
      await refreshAfterMutation()
    } catch {
      error.value = 'Impossibile approvare la richiesta.'
    }
  }

  async function cancella(r: RichiestaCambioTurno) {
    error.value = ''
    try {
      await deleteCambioTurno(r.id)
      await refreshAfterMutation()
    } catch {
      error.value = 'Impossibile annullare la richiesta.'
    }
  }

  async function confermaRifiuto() {
    if (!rifiutoTarget.value) return
    error.value = ''
    try {
      await rispondiCaposala(rifiutoTarget.value.id, {
        accetta: false,
        motivo_rifiuto: motivoRifiuto.value,
      })
      rifiutoDialog.value = false
      await refreshAfterMutation()
    } catch {
      error.value = 'Impossibile rifiutare la richiesta.'
    }
  }

  return {
    richieste,
    utenti,
    assegnazioni,
    loading,
    error,
    dialogOpen,
    saving,
    form,
    colleghi,
    currentRole,
    currentUserId,
    canRequestChange,
    rifiutoDialog,
    rifiutoTarget,
    motivoRifiuto,
    setRichieste,
    setUtenti,
    nomeUtente,
    load,
    apriNuova,
    salva,
    rispondiComeCollega,
    apriRifiuto,
    approvaCaposala,
    cancella,
    confermaRifiuto,
  }
}
