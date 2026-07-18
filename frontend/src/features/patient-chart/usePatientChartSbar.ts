import { ref, unref, type MaybeRef } from 'vue'
import { listConsegneSbar, type ConsegnaSbar } from '@/api/consegneSbar'

export function usePatientChartSbar(pazienteId: MaybeRef<number>) {
  const consegne = ref<ConsegnaSbar[]>([])
  const consegneLoaded = ref(false)

  async function loadConsegneSbar(force = false) {
    if (consegneLoaded.value && !force) return

    const { data } = await listConsegneSbar({ limit: 200 })
    consegne.value = data.items.filter(
      (consegna) => consegna.paziente_id === unref(pazienteId),
    )
    consegneLoaded.value = true
  }

  return {
    consegne,
    consegneLoaded,
    loadConsegneSbar,
  }
}
