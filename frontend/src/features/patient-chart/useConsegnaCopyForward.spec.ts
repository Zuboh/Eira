import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as consegneSbarApi from '@/api/consegneSbar'
import * as diarioCedemaApi from '@/api/diarioCedema'
import { useConsegnaCopyForward } from '@/features/patient-chart/useConsegnaCopyForward'
import { createEmptyGenericConsegnaForm } from '@/features/patient-chart/form'
import type { GenericConsegnaForm } from '@/features/patient-chart/types'

vi.mock('@/api/consegneSbar')
vi.mock('@/api/diarioCedema')

const ultimaSbar = {
  id: 1,
  paziente_id: 7,
  turno_id: 5,
  autore_id: 9,
  situation: 'vecchia situation',
  background: 'diabete, terapia insulinica',
  assessment: 'vecchio assessment',
  recommendation: 'vecchia recommendation',
  priorita: 'normale' as const,
  creata_il: '2026-07-18T10:00:00Z',
}

function setup(overrides: Partial<GenericConsegnaForm> = {}) {
  const form = ref<GenericConsegnaForm>({
    ...createEmptyGenericConsegnaForm(),
    paziente_id: 7,
    testo: 'S:\nB:\nA:\nR:',
    ...overrides,
  })
  const error = ref('')
  return { form, error, hook: useConsegnaCopyForward({ form, error }) }
}

beforeEach(() => {
  vi.mocked(consegneSbarApi.getUltimaConsegnaSbar).mockResolvedValue({
    data: ultimaSbar,
  })
})

describe('useConsegnaCopyForward', () => {
  it('riprende solo le sezioni copyForward e le marca', async () => {
    const { form, hook } = setup()

    await hook.riprendiUltima()

    expect(form.value.testo).toBe('S:\nB: diabete, terapia insulinica\nA:\nR:')
    expect(hook.copiedKeys.value).toEqual(['background'])
  })

  it('riprende una singola sezione su richiesta', async () => {
    const { form, hook } = setup()

    await hook.riprendiSezione('recommendation')

    expect(form.value.testo).toBe('S:\nB:\nA:\nR: vecchia recommendation')
    expect(hook.copiedKeys.value).toEqual(['recommendation'])
  })

  it('perde la marcatura quando la sezione ripresa viene modificata', async () => {
    const { form, hook } = setup()

    await hook.riprendiUltima()
    form.value.testo = 'S:\nB: diabete, insulina sospesa\nA:\nR:'

    expect(hook.copiedKeys.value).toEqual([])
  })

  it('non rilegge l API per lo stesso paziente e tipo', async () => {
    const { hook } = setup()

    await hook.riprendiUltima()
    await hook.riprendiSezione('assessment')

    expect(consegneSbarApi.getUltimaConsegnaSbar).toHaveBeenCalledOnce()
  })

  it('spiega che non c e una consegna precedente invece di fallire', async () => {
    vi.mocked(consegneSbarApi.getUltimaConsegnaSbar).mockResolvedValue({
      data: null,
    })
    const { form, error, hook } = setup()

    await hook.riprendiUltima()

    expect(error.value).toBe('Nessuna consegna precedente per questo paziente.')
    expect(form.value.testo).toBe('S:\nB:\nA:\nR:')
  })

  it('legge il diario CEDEMA quando il tipo e cedema', async () => {
    vi.mocked(diarioCedemaApi.getUltimaVoceDiarioCedema).mockResolvedValue({
      data: {
        id: 3,
        paziente_id: 7,
        turno_id: null,
        autore_id: 9,
        coscienza: 'vigile e orientato',
        emotivita: 'sereno',
        dolore: 'assente',
        emodinamica: 'PA 120/80',
        mobilizzazione: 'autonomo con deambulatore',
        allert: 'allergia penicillina',
        timestamp: '2026-07-18T10:00:00Z',
      },
    })
    const { form, hook } = setup({
      tipo: 'cedema',
      testo: 'C:\nE:\nD:\nE:\nM:\nA:',
    })

    await hook.riprendiUltima()

    expect(form.value.testo).toBe(
      'C: vigile e orientato\nE:\nD:\nE:\nM: autonomo con deambulatore\nA:',
    )
    expect(hook.copiedKeys.value).toEqual(['coscienza', 'mobilizzazione'])
  })

  it('non e disponibile senza paziente selezionato', async () => {
    const { hook } = setup({ paziente_id: null })

    expect(hook.canCopyForward.value).toBe(false)
    await hook.riprendiUltima()
    expect(consegneSbarApi.getUltimaConsegnaSbar).not.toHaveBeenCalled()
  })
})
