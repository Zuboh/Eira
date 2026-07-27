import { computed, ref } from 'vue'
import { listCarelloFarmaci, type CarelloFarmaco } from '@/api/carelloFarmaci'
import { listCambiTurno, type RichiestaCambioTurno } from '@/api/cambiTurno'
import { listConsegneSbar, type ConsegnaSbar } from '@/api/consegneSbar'
import { listPazienti, type Paziente } from '@/api/pazienti'
import {
  getMieiProssimiTurni,
  type ProssimoTurnoConColleghi,
} from '@/api/turni'
import { listUtenti, type Utente } from '@/api/utenti'
import { buildTurniEvents } from '@/features/dashboard/infermiereCalendarViewModel'

export function useInfermiereDashboard() {
  const turniConColleghi = ref<ProssimoTurnoConColleghi[]>([])
  const consegne = ref<ConsegnaSbar[]>([])
  const farmaci = ref<CarelloFarmaco[]>([])
  const pazienti = ref<Paziente[]>([])
  const cambiTurno = ref<RichiestaCambioTurno[]>([])
  const utenti = ref<Utente[]>([])
  const loading = ref(false)
  const error = ref('')

  const pazientiById = computed(
    () => new Map(pazienti.value.map((paziente) => [paziente.id, paziente])),
  )
  const utentiById = computed(
    () => new Map(utenti.value.map((utente) => [utente.id, utente])),
  )

  const prossimiTurniConColleghi = computed(() =>
    turniConColleghi.value.slice(0, 4),
  )

  const calendarEvents = computed(() =>
    buildTurniEvents(turniConColleghi.value),
  )

  const consegneRecenti = computed(() => consegne.value)
  const pazientiAttivi = computed(() =>
    pazienti.value.filter((paziente) => !paziente.dimesso),
  )
  const farmaciCritici = computed(() =>
    farmaci.value.filter((riga) => riga.quantita < riga.soglia_minima),
  )
  const richiesteCambioTurno = computed(() =>
    cambiTurno.value
      .filter((richiesta) => richiesta.stato === 'in_attesa_caposala')
      .slice(0, 3),
  )

  function nomePaziente(pazienteId: number) {
    const paziente = pazientiById.value.get(pazienteId)
    return paziente ? `${paziente.cognome} ${paziente.nome}` : `#${pazienteId}`
  }

  function nomeUtente(utenteId: number) {
    const utente = utentiById.value.get(utenteId)
    return utente ? `${utente.cognome} ${utente.nome}` : `#${utenteId}`
  }

  async function load() {
    error.value = ''
    loading.value = true
    try {
      const [
        prossimiTurniResponse,
        consegneResponse,
        pazientiResponse,
        farmaciResponse,
        cambiTurnoResponse,
        utentiResponse,
      ] = await Promise.all([
        getMieiProssimiTurni({ limit: 60 }),
        listConsegneSbar({ limit: 5 }),
        listPazienti(),
        listCarelloFarmaci(),
        listCambiTurno(),
        listUtenti(),
      ])
      turniConColleghi.value = prossimiTurniResponse.data
      consegne.value = consegneResponse.data.items
      pazienti.value = pazientiResponse.data
      farmaci.value = farmaciResponse.data
      cambiTurno.value = cambiTurnoResponse.data
      utenti.value = utentiResponse.data
    } catch {
      error.value = 'Impossibile caricare la dashboard.'
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    prossimiTurniConColleghi,
    calendarEvents,
    consegneRecenti,
    pazientiAttivi,
    farmaciCritici,
    richiesteCambioTurno,
    nomePaziente,
    nomeUtente,
    load,
  }
}
