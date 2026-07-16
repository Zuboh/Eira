import { ref, unref, type MaybeRef } from 'vue'
import { getPaziente, type Paziente } from '@/api/pazienti'
import { getMieAssegnazioni, type AssegnazioneTurno } from '@/api/turni'
import { listDiarioCedema, type VoceDiarioCedema } from '@/api/diarioCedema'
import { getValutazioni, type ValutazioneConley, type ValutazioneNorton } from '@/api/valutazioni'

export function usePatientChartQueries(pazienteId: MaybeRef<number>, ruolo: MaybeRef<string | null>) {
  const paziente = ref<Paziente | null>(null)
  const error = ref('')
  const loading = ref(false)

  const cedema = ref<VoceDiarioCedema[]>([])
  const norton = ref<ValutazioneNorton[]>([])
  const conley = ref<ValutazioneConley[]>([])
  const assegnazioni = ref<AssegnazioneTurno[]>([])

  async function reloadCedema() {
    const { data } = await listDiarioCedema(unref(pazienteId))
    cedema.value = data
  }

  async function reloadValutazioni() {
    const { data } = await getValutazioni(unref(pazienteId))
    norton.value = data.norton
    conley.value = data.conley
  }

  async function load() {
    error.value = ''
    loading.value = true
    try {
      const [p, d, v] = await Promise.all([
        getPaziente(unref(pazienteId)),
        listDiarioCedema(unref(pazienteId)),
        getValutazioni(unref(pazienteId)),
      ])
      paziente.value = p.data
      cedema.value = d.data
      norton.value = v.data.norton
      conley.value = v.data.conley
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
    norton,
    conley,
    assegnazioni,
    load,
    reloadCedema,
    reloadValutazioni,
  }
}
