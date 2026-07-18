import { onMounted, ref, watch, type MaybeRef, unref } from 'vue'
import { getBancaOre, type BancaOre } from '@/api/bancaOre'
import { listUtentiByReparto, type UtenteTile } from '@/api/reparti'
import { useAuthStore } from '@/stores/auth'

function meseCorrente() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function spostaMeseValue(mese: string, delta: number) {
  const [anno, month] = mese.split('-').map(Number)
  const date = new Date(anno, month - 1 + delta, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

type UseBancaOreOptions = {
  infermiereId?: MaybeRef<number | null | undefined>
  loadInfermieriForCaposala?: boolean
}

export function useBancaOre(options: UseBancaOreOptions = {}) {
  const auth = useAuthStore()

  const mese = ref(meseCorrente())
  const infermieri = ref<UtenteTile[]>([])
  const infermiereId = ref<number | null>(
    unref(options.infermiereId) ?? auth.user?.id ?? null,
  )
  const bancaOre = ref<BancaOre | null>(null)
  const loading = ref(false)
  const error = ref('')

  function spostaMese(delta: number) {
    mese.value = spostaMeseValue(mese.value, delta)
  }

  async function load() {
    if (!infermiereId.value) return
    error.value = ''
    loading.value = true
    try {
      const { data } = await getBancaOre(infermiereId.value, mese.value)
      bancaOre.value = data
    } catch {
      error.value = 'Impossibile caricare la banca ore.'
      bancaOre.value = null
    } finally {
      loading.value = false
    }
  }

  async function loadInfermieri() {
    if (
      !options.loadInfermieriForCaposala ||
      auth.ruolo !== 'caposala' ||
      !auth.user
    )
      return

    const { data } = await listUtentiByReparto(auth.user.reparto_id)
    infermieri.value = data.filter((utente) => utente.ruolo === 'infermiere')
    infermiereId.value = infermieri.value[0]?.id ?? null
  }

  onMounted(async () => {
    if (options.loadInfermieriForCaposala) {
      await loadInfermieri()
      return
    }

    await load()
  })

  watch([mese, infermiereId], load)

  return {
    mese,
    infermieri,
    infermiereId,
    bancaOre,
    loading,
    error,
    load,
    spostaMese,
  }
}
