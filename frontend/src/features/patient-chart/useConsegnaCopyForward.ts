import { computed, ref, type Ref } from 'vue'
import { getUltimaConsegnaSbar } from '@/api/consegneSbar'
import { getUltimaVoceDiarioCedema } from '@/api/diarioCedema'
import {
  parseConsegnaText,
  sectionsFor,
  serializeToSigle,
} from '@/features/patient-chart/consegnaSections'
import type {
  GenericConsegnaForm,
  GenericConsegnaKind,
} from '@/features/patient-chart/types'

type CopyForwardOptions = {
  form: Ref<GenericConsegnaForm>
  error: Ref<string>
}

type SectionValues = Record<string, string>

/**
 * Riprende le sezioni dall'ultima consegna del paziente. Il bottone globale
 * copia solo le sezioni con `copyForward: true` — Situation e Assessment sono
 * time-sensitive, propagarle in automatico spaccia informazione stantia per
 * fresca. Le altre si pescano una per una dal preview.
 *
 * Le sezioni riprese e non ancora modificate restano marcate: `copiedKeys`
 * confronta il valore copiato con quello attuale, quindi la marcatura cade da
 * sola appena l'utente scrive.
 */
export function useConsegnaCopyForward({ form, error }: CopyForwardOptions) {
  const loading = ref(false)
  const copied = ref<SectionValues>({})
  const cache = new Map<string, SectionValues | null>()

  const canCopyForward = computed(() => form.value.paziente_id !== null)

  const copiedKeys = computed(() => {
    const { values } = parseConsegnaText(form.value.testo, form.value.tipo)
    return Object.keys(copied.value).filter(
      (key) => values[key] === copied.value[key],
    )
  })

  function reset() {
    copied.value = {}
  }

  async function fetchUltima(
    pazienteId: number,
    tipo: GenericConsegnaKind,
  ): Promise<SectionValues | null> {
    const cacheKey = `${tipo}:${pazienteId}`
    const cached = cache.get(cacheKey)
    if (cached !== undefined) return cached

    const values =
      tipo === 'sbar'
        ? sbarValues((await getUltimaConsegnaSbar(pazienteId)).data)
        : cedemaValues((await getUltimaVoceDiarioCedema(pazienteId)).data)

    cache.set(cacheKey, values)
    return values
  }

  async function applica(keys: string[] | null) {
    const pazienteId = form.value.paziente_id
    if (pazienteId === null) return

    loading.value = true
    error.value = ''
    try {
      const ultima = await fetchUltima(pazienteId, form.value.tipo)
      if (ultima === null) {
        error.value = 'Nessuna consegna precedente per questo paziente.'
        return
      }

      const wanted =
        keys ??
        sectionsFor(form.value.tipo)
          .filter((section) => section.copyForward)
          .map((section) => section.key)

      const { values } = parseConsegnaText(form.value.testo, form.value.tipo)
      const applied: SectionValues = { ...copied.value }
      for (const key of wanted) {
        const value = (ultima[key] ?? '').trim()
        if (!value) continue
        values[key] = value
        applied[key] = value
      }

      copied.value = applied
      form.value.testo = serializeToSigle(values, form.value.tipo)
    } catch {
      error.value = 'Impossibile recuperare la consegna precedente.'
    } finally {
      loading.value = false
    }
  }

  return {
    copyForwardLoading: loading,
    canCopyForward,
    copiedKeys,
    resetCopyForward: reset,
    riprendiUltima: () => applica(null),
    riprendiSezione: (key: string) => applica([key]),
  }
}

function sbarValues(
  consegna: {
    situation: string
    background: string
    assessment: string
    recommendation: string
  } | null,
): SectionValues | null {
  if (consegna === null) return null
  return {
    situation: consegna.situation,
    background: consegna.background,
    assessment: consegna.assessment,
    recommendation: consegna.recommendation,
  }
}

function cedemaValues(
  voce: {
    coscienza: string
    emotivita: string
    dolore: string
    emodinamica: string
    mobilizzazione: string
    allert: string
  } | null,
): SectionValues | null {
  if (voce === null) return null
  return {
    coscienza: voce.coscienza,
    emotivita: voce.emotivita,
    dolore: voce.dolore,
    emodinamica: voce.emodinamica,
    mobilizzazione: voce.mobilizzazione,
    allert: voce.allert,
  }
}
