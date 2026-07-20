import { ref, unref, type MaybeRef } from 'vue'
import { getPaziente, type Paziente } from '@/api/pazienti'
import { getMieAssegnazioni, type AssegnazioneTurno } from '@/api/turni'
import { listDiarioCedema, type VoceDiarioCedema } from '@/api/diarioCedema'
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

export function usePatientChartQueries(
  pazienteId: MaybeRef<number>,
  ruolo: MaybeRef<string | null>,
) {
  const paziente = ref<Paziente | null>(null)
  const error = ref('')
  const loading = ref(false)

  const cedema = ref<VoceDiarioCedema[]>([])
  const sbar = ref<ConsegnaSbar[]>([])
  const norton = ref<ValutazioneNorton[]>([])
  const conley = ref<ValutazioneConley[]>([])
  const parametriVitali = ref<ParametriVitali[]>([])
  const assegnazioni = ref<AssegnazioneTurno[]>([])

  async function reloadTimeline() {
    const [cedemaResponse, sbarResponse] = await Promise.all([
      listDiarioCedema(unref(pazienteId)),
      listConsegneSbarByPaziente(unref(pazienteId)),
    ])
    cedema.value = cedemaResponse.data
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
          listDiarioCedema(unref(pazienteId)),
          listConsegneSbarByPaziente(unref(pazienteId)),
        ]),
        getValutazioni(unref(pazienteId)),
        listParametriVitali(unref(pazienteId)),
      ])
      paziente.value = p.data
      cedema.value = timelineData[0].data
      sbar.value = timelineData[1].data
      norton.value = v.data.norton
      conley.value = v.data.conley
      parametriVitali.value = pv.data
      if (unref(ruolo) === 'infermiere') {
        const a = await getMieAssegnazioni()
        assegnazioni.value = a.data
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
    cedema,
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
