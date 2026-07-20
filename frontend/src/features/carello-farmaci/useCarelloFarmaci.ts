import { computed, ref } from 'vue'
import {
  listCarelloFarmaci,
  listMovimentiFarmaci,
  updateCarelloFarmaco,
  type CarelloFarmaco,
  type MovimentoFarmaco,
} from '@/api/carelloFarmaci'

export function useCarelloFarmaci() {
  const farmaci = ref<CarelloFarmaco[]>([])
  const movimenti = ref<MovimentoFarmaco[]>([])
  const search = ref('')
  const categoria = ref('')
  const loading = ref(false)
  const movimentiLoading = ref(false)
  const updatingIds = ref<Set<number>>(new Set())
  const error = ref('')
  const movimentiError = ref('')

  const categorie = computed(() =>
    [...new Set(farmaci.value.map((riga) => riga.farmaco.categoria))].sort(),
  )

  const alertFarmaci = computed(() =>
    farmaci.value.filter((riga) => isSottoSoglia(riga) || isInScadenza(riga)),
  )

  const farmaciFiltrati = computed(() => {
    const term = search.value.trim().toLowerCase()
    return farmaci.value.filter((riga) => {
      const matchesSearch = !term || riga.farmaco.nome.toLowerCase().includes(term)
      const matchesCategoria = !categoria.value || riga.farmaco.categoria === categoria.value
      return matchesSearch && matchesCategoria
    })
  })

  function isSottoSoglia(riga: CarelloFarmaco) {
    return riga.quantita < riga.soglia_minima
  }

  function giorniAllaScadenza(riga: CarelloFarmaco) {
    if (!riga.prossima_scadenza) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiry = new Date(`${riga.prossima_scadenza}T00:00:00`)
    return Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000)
  }

  function isInScadenza(riga: CarelloFarmaco) {
    const giorni = giorniAllaScadenza(riga)
    return giorni !== null && giorni <= 30
  }

  function expiryLabel(riga: CarelloFarmaco) {
    const giorni = giorniAllaScadenza(riga)
    if (giorni === null) return ''
    if (giorni < 0) return 'Scaduto'
    if (giorni === 0) return 'Scade oggi'
    return `Scade tra ${giorni} gg`
  }

  async function load() {
    error.value = ''
    loading.value = true
    try {
      const { data } = await listCarelloFarmaci()
      farmaci.value = data
    } catch {
      error.value = 'Impossibile caricare il carello farmaci.'
    } finally {
      loading.value = false
    }
  }

  async function loadMovimenti(farmacoId?: number) {
    movimentiError.value = ''
    movimentiLoading.value = true
    try {
      const { data } = await listMovimentiFarmaci({ farmaco_id: farmacoId })
      movimenti.value = data
    } catch {
      movimentiError.value = 'Impossibile caricare lo storico movimenti.'
    } finally {
      movimentiLoading.value = false
    }
  }

  async function adjust(riga: CarelloFarmaco, delta: number) {
    if (updatingIds.value.has(riga.id)) return
    error.value = ''
    const previous = riga.quantita
    const optimistic = Math.max(0, previous + delta)
    riga.quantita = optimistic
    updatingIds.value = new Set(updatingIds.value).add(riga.id)
    try {
      const { data } = await updateCarelloFarmaco(riga.id, { delta })
      const index = farmaci.value.findIndex((item) => item.id === riga.id)
      if (index !== -1) farmaci.value[index] = data
      await loadMovimenti()
    } catch {
      riga.quantita = previous
      error.value = 'Impossibile aggiornare la quantità.'
    } finally {
      const next = new Set(updatingIds.value)
      next.delete(riga.id)
      updatingIds.value = next
    }
  }

  return {
    farmaci,
    movimenti,
    search,
    categoria,
    categorie,
    alertFarmaci,
    farmaciFiltrati,
    loading,
    movimentiLoading,
    updatingIds,
    error,
    movimentiError,
    isSottoSoglia,
    isInScadenza,
    expiryLabel,
    load,
    loadMovimenti,
    adjust,
  }
}
