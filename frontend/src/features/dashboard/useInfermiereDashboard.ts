import { computed, ref } from 'vue'
import { listCarelloFarmaci, type CarelloFarmaco } from '@/api/carelloFarmaci'
import { listConsegneSbar, type ConsegnaSbar } from '@/api/consegneSbar'
import { listPazienti, type Paziente } from '@/api/pazienti'
import {
  getMieiProssimiTurni,
  type ProssimoTurnoConColleghi,
} from '@/api/turni'
import { buildTurniEvents } from '@/features/dashboard/infermiereCalendarViewModel'

export function useInfermiereDashboard() {
  const turniConColleghi = ref<ProssimoTurnoConColleghi[]>([])
  const consegne = ref<ConsegnaSbar[]>([])
  const farmaci = ref<CarelloFarmaco[]>([])
  const pazienti = ref<Paziente[]>([])
  const loading = ref(false)
  const error = ref('')

  const pazientiById = computed(
    () => new Map(pazienti.value.map((paziente) => [paziente.id, paziente])),
  )

  const prossimiTurniConColleghi = computed(() =>
    turniConColleghi.value.slice(0, 4),
  )

  const calendarEvents = computed(() =>
    buildTurniEvents(turniConColleghi.value),
  )

  const consegneRecenti = computed(() => consegne.value)
  const pazientiAttivi = computed(() => pazienti.value)
  const farmaciCritici = computed(() =>
    farmaci.value.filter((riga) => riga.quantita < riga.soglia_minima),
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
        prossimiTurniResponse,
        consegneResponse,
        pazientiResponse,
        farmaciResponse,
      ] = await Promise.all([
        getMieiProssimiTurni({ limit: 60 }),
        listConsegneSbar({ limit: 5 }),
        listPazienti(),
        listCarelloFarmaci(),
      ])
      turniConColleghi.value = prossimiTurniResponse.data
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
    prossimiTurniConColleghi,
    calendarEvents,
    consegneRecenti,
    pazientiAttivi,
    farmaciCritici,
    nomePaziente,
    load,
  }
}
