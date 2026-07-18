import { computed, ref } from 'vue'
import { getDashboardCaposala, type DashboardCaposala } from '@/api/dashboard'
import {
  getCalendarioTurni,
  assegnaTurno,
  type Turno,
  type TurnoCalendario,
} from '@/api/turni'
import { listUtenti, type Utente } from '@/api/utenti'
import { useCambiTurno } from '@/features/cambi-turno/useCambiTurno'
import { buildCalendarioRows } from '@/features/dashboard/calendarViewModel'

export function useCaposalaDashboard() {
  const pendingCount = ref(0)
  const utenti = ref<Utente[]>([])
  const dashboard = ref<DashboardCaposala | null>(null)
  const calendario = ref<TurnoCalendario[]>([])
  const loading = ref(false)
  const error = ref('')

  const assegnaDialog = ref(false)
  const assegnaTarget = ref<Turno | null>(null)
  const assegnaInfermiereId = ref<number | null>(null)
  const saving = ref(false)

  const utentiById = computed(
    () => new Map(utenti.value.map((utente) => [utente.id, utente])),
  )
  const infermieri = computed(() =>
    utenti.value.filter((u) => u.ruolo === 'infermiere'),
  )

  function nomeUtente(utenteId: number) {
    const utente = utentiById.value.get(utenteId)
    return utente ? `${utente.cognome} ${utente.nome}` : `#${utenteId}`
  }

  const righeCalendario = computed(() =>
    buildCalendarioRows(calendario.value, nomeUtente),
  )

  async function load() {
    error.value = ''
    loading.value = true
    try {
      const [u, d, c] = await Promise.all([
        listUtenti(),
        getDashboardCaposala(),
        getCalendarioTurni(),
      ])
      utenti.value = u.data
      dashboard.value = d.data
      cambiTurno.setRichieste(d.data.cambi_turno_in_attesa)
      cambiTurno.setUtenti(u.data)
      calendario.value = c.data
      pendingCount.value = u.data.filter((x) => x.stato === 'in_attesa').length
    } catch {
      error.value = 'Impossibile caricare la dashboard.'
    } finally {
      loading.value = false
    }
  }

  function apriAssegna(turno: Turno) {
    assegnaTarget.value = turno
    assegnaInfermiereId.value = null
    assegnaDialog.value = true
  }

  async function confermaAssegna() {
    if (!assegnaTarget.value || !assegnaInfermiereId.value) return
    saving.value = true
    error.value = ''
    try {
      await assegnaTurno(assegnaTarget.value.id, assegnaInfermiereId.value)
      assegnaDialog.value = false
      await load()
    } catch {
      error.value = 'Impossibile assegnare il turno.'
    } finally {
      saving.value = false
    }
  }

  const cambiTurno = useCambiTurno({ refreshAfterMutation: load })

  return {
    pendingCount,
    dashboard,
    loading,
    error,
    infermieri,
    righeCalendario,
    assegnaDialog,
    assegnaTarget,
    assegnaInfermiereId,
    saving,
    richiesteCambioTurno: cambiTurno.richieste,
    cambioTurnoError: cambiTurno.error,
    cambioTurnoRifiutoDialog: cambiTurno.rifiutoDialog,
    cambioTurnoMotivoRifiuto: cambiTurno.motivoRifiuto,
    nomeUtenteCambioTurno: cambiTurno.nomeUtente,
    apriRifiutoCambioTurno: cambiTurno.apriRifiuto,
    approvaCambioTurnoCaposala: cambiTurno.approvaCaposala,
    confermaRifiutoCambioTurno: cambiTurno.confermaRifiuto,
    load,
    apriAssegna,
    confermaAssegna,
  }
}
