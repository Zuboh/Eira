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

const GIORNI_TURNI_SCOPERTI_DEFAULT = 7
const INTERVALLI_TURNI_SCOPERTI = [7, 14, 30] as const
const GIORNI_CALENDARIO = 7
const GIORNI_CALENDARIO_CACHE = 35
const GIORNI_PRECEDENTI_CALENDARIO_CACHE = 7

function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00`)
  next.setDate(next.getDate() + days)
  return toIsoDate(next)
}

export function useCaposalaDashboard() {
  const pendingCount = ref(0)
  const utenti = ref<Utente[]>([])
  const dashboard = ref<DashboardCaposala | null>(null)
  const dashboardPerIntervallo = new Map<number, DashboardCaposala>()
  const calendario = ref<TurnoCalendario[]>([])
  const turniScopertiGiorni = ref(GIORNI_TURNI_SCOPERTI_DEFAULT)
  const turniScopertiSetteGiorniCount = ref(0)
  const calendarioDa = ref(toIsoDate(new Date()))
  const calendarioCacheDa = addDays(
    calendarioDa.value,
    -GIORNI_PRECEDENTI_CALENDARIO_CACHE,
  )
  const calendarioCacheA = addDays(
    calendarioCacheDa,
    GIORNI_CALENDARIO_CACHE - 1,
  )
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

  const calendarioA = computed(() =>
    addDays(calendarioDa.value, GIORNI_CALENDARIO - 1),
  )
  const calendarioSettimana = computed(() =>
    calendario.value.filter(
      (turno) =>
        turno.data >= calendarioDa.value && turno.data <= calendarioA.value,
    ),
  )
  const righeCalendario = computed(() =>
    buildCalendarioRows(calendarioSettimana.value, nomeUtente),
  )
  const cambiDaApprovareCount = computed(
    () =>
      dashboard.value?.cambi_turno_in_attesa.filter(
        (richiesta) => richiesta.stato === 'in_attesa_caposala',
      ).length ?? 0,
  )
  const puoAndareSettimanaPrecedente = computed(
    () => addDays(calendarioDa.value, -GIORNI_CALENDARIO) >= calendarioCacheDa,
  )
  const puoAndareSettimanaSuccessiva = computed(
    () => addDays(calendarioA.value, GIORNI_CALENDARIO) <= calendarioCacheA,
  )

  async function load() {
    error.value = ''
    loading.value = true
    try {
      const [u, dashboardIntervalli, c] = await Promise.all([
        listUtenti(),
        Promise.all(
          INTERVALLI_TURNI_SCOPERTI.map(async (giorni) => {
            const response = await getDashboardCaposala({
              giorni,
              limit: giorni === 30 ? 90 : 50,
            })
            return [giorni, response.data] as const
          }),
        ),
        getCalendarioTurni({
          da: calendarioCacheDa,
          a: calendarioCacheA,
        }),
      ])
      for (const [giorni, intervallo] of dashboardIntervalli) {
        dashboardPerIntervallo.set(giorni, intervallo)
      }
      const dashboardSelezionata = dashboardPerIntervallo.get(
        turniScopertiGiorni.value,
      )
      const dashboardSetteGiorni = dashboardPerIntervallo.get(
        GIORNI_TURNI_SCOPERTI_DEFAULT,
      )
      if (!dashboardSelezionata || !dashboardSetteGiorni) {
        throw new Error('Intervallo dashboard mancante')
      }
      utenti.value = u.data
      dashboard.value = dashboardSelezionata
      cambiTurno.setRichieste(dashboardSelezionata.cambi_turno_in_attesa)
      cambiTurno.setUtenti(u.data)
      calendario.value = c.data
      turniScopertiSetteGiorniCount.value =
        dashboardSetteGiorni.turni_scoperti_count
      pendingCount.value = u.data.filter((x) => x.stato === 'in_attesa').length
    } catch {
      error.value = 'Impossibile caricare la dashboard.'
    } finally {
      loading.value = false
    }
  }

  function setTurniScopertiGiorni(giorni: number) {
    if (giorni === turniScopertiGiorni.value) return

    const dashboardSelezionata = dashboardPerIntervallo.get(giorni)
    if (!dashboardSelezionata) return

    turniScopertiGiorni.value = giorni
    dashboard.value = dashboardSelezionata
    cambiTurno.setRichieste(dashboardSelezionata.cambi_turno_in_attesa)
  }

  function spostaSettimanaCalendario(offset: number) {
    const nuovaData = addDays(calendarioDa.value, offset * GIORNI_CALENDARIO)
    const nuovaDataFine = addDays(nuovaData, GIORNI_CALENDARIO - 1)

    if (nuovaData < calendarioCacheDa || nuovaDataFine > calendarioCacheA) {
      return
    }

    calendarioDa.value = nuovaData
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
    turniScopertiGiorni,
    turniScopertiSetteGiorniCount,
    cambiDaApprovareCount,
    calendarioDa,
    calendarioA,
    puoAndareSettimanaPrecedente,
    puoAndareSettimanaSuccessiva,
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
    setTurniScopertiGiorni,
    spostaSettimanaCalendario,
    apriAssegna,
    confermaAssegna,
  }
}
