import { computed, ref } from 'vue'
import { listCarelloFarmaci, type CarelloFarmaco } from '@/api/carelloFarmaci'
import { listConsegneSbar, type ConsegnaSbar } from '@/api/consegneSbar'
import { listPazienti, type Paziente } from '@/api/pazienti'
import {
  getMieAssegnazioni,
  listTurni,
  type AssegnazioneTurno,
  type Turno,
} from '@/api/turni'
import { buildTurniEvents } from '@/features/dashboard/infermiereCalendarViewModel'

const oggi = new Date().toISOString().slice(0, 10)

export function useInfermiereDashboard() {
  const assegnazioni = ref<AssegnazioneTurno[]>([])
  const turni = ref<Turno[]>([])
  const consegne = ref<ConsegnaSbar[]>([])
  const farmaci = ref<CarelloFarmaco[]>([])
  const pazienti = ref<Paziente[]>([])
  const loading = ref(false)
  const error = ref('')

  const turniById = computed(
    () => new Map(turni.value.map((turno) => [turno.id, turno])),
  )
  const pazientiById = computed(
    () => new Map(pazienti.value.map((paziente) => [paziente.id, paziente])),
  )

  const mieiTurni = computed(() => {
    return assegnazioni.value
      .filter((assegnazione) => assegnazione.stato === 'attiva')
      .map((assegnazione) => turniById.value.get(assegnazione.turno_id))
      .filter(
        (turno): turno is Turno => turno !== undefined && turno.data >= oggi,
      )
      .sort((turnoA, turnoB) => turnoA.data.localeCompare(turnoB.data))
      .slice(0, 4)
  })

  const calendarEvents = computed(() =>
    buildTurniEvents(assegnazioni.value, turni.value),
  )

  const consegneRecenti = computed(() => consegne.value)
  const pazientiAttivi = computed(() => pazienti.value)
  const farmaciCritici = computed(() =>
    farmaci.value.filter((riga) => {
      const giorni = riga.prossima_scadenza
        ? Math.ceil(
            (new Date(`${riga.prossima_scadenza}T00:00:00`).getTime() -
              new Date(oggi).getTime()) /
              86_400_000,
          )
        : null
      return riga.quantita < riga.soglia_minima || (giorni !== null && giorni <= 30)
    }),
  )

  function nomePaziente(pazienteId: number) {
    const paziente = pazientiById.value.get(pazienteId)
    return paziente ? `${paziente.cognome} ${paziente.nome}` : `#${pazienteId}`
  }

  async function load() {
    error.value = ''
    loading.value = true
    try {
      const [
        assegnazioniResponse,
        turniResponse,
        consegneResponse,
        pazientiResponse,
        farmaciResponse,
      ] = await Promise.all([
        getMieAssegnazioni(),
        listTurni(),
        listConsegneSbar({ limit: 5 }),
        listPazienti(),
        listCarelloFarmaci(),
      ])
      assegnazioni.value = assegnazioniResponse.data
      turni.value = turniResponse.data
      consegne.value = consegneResponse.data.items
      pazienti.value = pazientiResponse.data.filter(
        (paziente) => !paziente.dimesso,
      )
      farmaci.value = farmaciResponse.data
    } catch {
      error.value = 'Impossibile caricare la dashboard.'
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    mieiTurni,
    calendarEvents,
    consegneRecenti,
    pazientiAttivi,
    farmaciCritici,
    nomePaziente,
    load,
  }
}
