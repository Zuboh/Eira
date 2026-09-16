import { ref, unref, type MaybeRef } from 'vue'
import { getPaziente, type Paziente } from '@/api/pazienti'
import { getMieAssegnazioni, listTurni } from '@/api/turni'
import { listDiarioSoapie, type VoceDiarioSoapie } from '@/api/diarioSoapie'
import {
  listParametriVitali,
  type ParametriVitali,
} from '@/api/parametriVitali'
import {
  getValutazioni,
  type ValutazioneConley,
  type ValutazioneNorton,
} from '@/api/valutazioni'
import {
  listConsegneSbarByPaziente,
  type ConsegnaSbar,
} from '@/api/consegneSbar'
import {
  buildAssegnazioneTurnoOptions,
  type AssegnazioneTurnoOption,
} from '@/features/sbar/turnoOptions'

export function usePatientChartQueries(
  pazienteId: MaybeRef<number>,
  ruolo: MaybeRef<string | null>,
) {
  const paziente = ref<Paziente | null>(null)
  const error = ref('')
  const loading = ref(false)

  const soapie = ref<VoceDiarioSoapie[]>([])
  const sbar = ref<ConsegnaSbar[]>([])
  const norton = ref<ValutazioneNorton[]>([])
  const conley = ref<ValutazioneConley[]>([])
  const parametriVitali = ref<ParametriVitali[]>([])
  const assegnazioni = ref<AssegnazioneTurnoOption[]>([])

  async function reloadTimeline() {
    const [soapieResponse, sbarResponse] = await Promise.all([
      listDiarioSoapie(unref(pazienteId)),
      listConsegneSbarByPaziente(unref(pazienteId)),
    ])
    soapie.value = soapieResponse.data
    sbar.value = sbarResponse.data
  }

  async function reloadValutazioni() {
    const { data } = await getValutazioni(unref(pazienteId))
    norton.value = data.norton
    conley.value = data.conley
  }

  async function reloadParametriVitali() {
    const { data } = await listParametriVitali(unref(pazienteId))
    parametriVitali.value = data
  }

  async function load() {
    error.value = ''
    loading.value = true
    try {
      const [p, timelineData, v, pv] = await Promise.all([
        getPaziente(unref(pazienteId)),
        Promise.all([
          listDiarioSoapie(unref(pazienteId)),
          listConsegneSbarByPaziente(unref(pazienteId)),
        ]),
        getValutazioni(unref(pazienteId)),
        listParametriVitali(unref(pazienteId)),
      ])
      paziente.value = p.data
      soapie.value = timelineData[0].data
      sbar.value = timelineData[1].data
      norton.value = v.data.norton
      conley.value = v.data.conley
      parametriVitali.value = pv.data
      if (unref(ruolo) === 'infermiere') {
        const [assegnazioniResponse, turniResponse] = await Promise.all([
          getMieAssegnazioni(),
          listTurni(),
        ])
        assegnazioni.value = buildAssegnazioneTurnoOptions(
          assegnazioniResponse.data,
          turniResponse.data,
        )
      }
    } catch {
      error.value = 'Impossibile caricare la scheda paziente.'
    } finally {
      loading.value = false
    }
  }

  return {
    paziente,
    error,
    loading,
    soapie,
    sbar,
    norton,
    conley,
    parametriVitali,
    assegnazioni,
    load,
    reloadTimeline,
    reloadValutazioni,
    reloadParametriVitali,
  }
}
