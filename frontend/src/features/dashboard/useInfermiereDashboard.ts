import { computed, ref } from 'vue'
import { listConsegneSbar, type ConsegnaSbar } from '@/api/consegneSbar'
import { listPazienti, type Paziente } from '@/api/pazienti'
import { getMieAssegnazioni, listTurni, type AssegnazioneTurno, type Turno } from '@/api/turni'
import { buildTurniEvents } from '@/features/dashboard/infermiereCalendarViewModel'

const oggi = new Date().toISOString().slice(0, 10)

export function useInfermiereDashboard() {
  const assegnazioni = ref<AssegnazioneTurno[]>([])
  const turni = ref<Turno[]>([])
  const consegne = ref<ConsegnaSbar[]>([])
  const pazienti = ref<Paziente[]>([])
  const loading = ref(false)
  const error = ref('')

  const turniById = computed(() => new Map(turni.value.map((turno) => [turno.id, turno])))
  const pazientiById = computed(() => new Map(pazienti.value.map((paziente) => [paziente.id, paziente])))

  const mieiTurni = computed(() => {
    return assegnazioni.value
      .filter((assegnazione) => assegnazione.stato === 'attiva')
      .map((assegnazione) => turniById.value.get(assegnazione.turno_id))
      .filter((turno): turno is Turno => turno !== undefined && turno.data >= oggi)
      .sort((turnoA, turnoB) => turnoA.data.localeCompare(turnoB.data))
      .slice(0, 4)
  })

  const calendarEvents = computed(() => buildTurniEvents(assegnazioni.value, turni.value))

  const consegneRecenti = computed(() => consegne.value)
  const pazientiAttivi = computed(() => pazienti.value)

  function nomePaziente(pazienteId: number) {
    const paziente = pazientiById.value.get(pazienteId)
    return paziente ? `${paziente.cognome} ${paziente.nome}` : `#${pazienteId}`
  }

  async function load() {
    error.value = ''
    loading.value = true
    try {
      const [assegnazioniResponse, turniResponse, consegneResponse, pazientiResponse] = await Promise.all([
        getMieAssegnazioni(),
        listTurni(),
        listConsegneSbar(),
        listPazienti(),
      ])
      assegnazioni.value = assegnazioniResponse.data
      turni.value = turniResponse.data
      consegne.value = consegneResponse.data.items.slice(0, 5)
      pazienti.value = pazientiResponse.data.filter((paziente) => !paziente.dimesso)
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
    nomePaziente,
    load,
  }
}
