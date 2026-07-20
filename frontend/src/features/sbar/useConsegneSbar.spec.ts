import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useConsegneSbar } from '@/features/sbar/useConsegneSbar'
import { useAuthStore } from '@/stores/auth'
import * as consegneSbarApi from '@/api/consegneSbar'
import * as diarioCedemaApi from '@/api/diarioCedema'
import * as pazientiApi from '@/api/pazienti'
import * as turniApi from '@/api/turni'
import type { ConsegnaSbar } from '@/api/consegneSbar'

vi.mock('@/api/consegneSbar')
vi.mock('@/api/diarioCedema')
vi.mock('@/api/pazienti')
vi.mock('@/api/turni')

const infermiere = {
  id: 9,
  email: 'x@x.it',
  nome: 'Anna',
  cognome: 'Rossi',
  ruolo: 'infermiere' as const,
  reparto_id: 1,
}
const paziente = {
  id: 1,
  nome: 'Mario',
  cognome: 'Bianchi',
  eta: 70,
  letto: '3B',
  data_ricovero: '2026-07-01',
  diagnosi_ingresso: 'Osservazione',
  reparto_id: 1,
  dimesso: false,
}

function consegna(overrides: Partial<ConsegnaSbar> = {}): ConsegnaSbar {
  return {
    id: 1,
    paziente_id: 1,
    turno_id: 5,
    autore_id: 9,
    situation: 'S',
    background: 'B',
    assessment: 'A',
    recommendation: 'R',
    priorita: 'normale',
    creata_il: '2026-07-18T10:00:00Z',
    ...overrides,
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.mocked(consegneSbarApi.listConsegneSbar).mockResolvedValue({
    data: { items: [], total: 0 },
  })
  vi.mocked(pazientiApi.listPazienti).mockResolvedValue({ data: [paziente] })
  vi.mocked(turniApi.getMieAssegnazioni).mockResolvedValue({ data: [] })
  vi.mocked(turniApi.listTurni).mockResolvedValue({ data: [] })
})

describe('useConsegneSbar — load', () => {
  it('loads consegne and pazienti, tracking total for pagination', async () => {
    vi.mocked(consegneSbarApi.listConsegneSbar).mockResolvedValue({
      data: { items: [consegna()], total: 1 },
    })
    const hook = useConsegneSbar()

    await hook.load()

    expect(hook.consegne.value).toEqual([consegna()])
    expect(hook.total.value).toBe(1)
    expect(hook.pazienti.value).toEqual([paziente])
  })

  it('sets an error message when loading fails', async () => {
    vi.mocked(consegneSbarApi.listConsegneSbar).mockRejectedValue(
      new Error('down'),
    )
    const hook = useConsegneSbar()

    await hook.load()

    expect(hook.error.value).toBe('Impossibile caricare le consegne SBAR.')
  })
})

describe('useConsegneSbar — role gates', () => {
  it('canCreateConsegna is true only for infermiere', () => {
    useAuthStore().user = { ...infermiere, ruolo: 'caposala' }
    expect(useConsegneSbar().canCreateConsegna.value).toBe(false)

    useAuthStore().user = infermiere
    expect(useConsegneSbar().canCreateConsegna.value).toBe(true)
  })

  it('canEditConsegna is true only for the consegna author', () => {
    useAuthStore().user = infermiere
    const hook = useConsegneSbar()

    expect(hook.canEditConsegna(consegna({ autore_id: 9 }))).toBe(true)
    expect(hook.canEditConsegna(consegna({ autore_id: 42 }))).toBe(false)
  })
})

describe('useConsegneSbar — apriNuova', () => {
  it('resets the form and loads assegnazioni once for an infermiere', async () => {
    useAuthStore().user = infermiere
    vi.mocked(turniApi.getMieAssegnazioni).mockResolvedValue({
      data: [{ id: 1, turno_id: 5, infermiere_id: 9, stato: 'attiva' }],
    })
    vi.mocked(turniApi.listTurni).mockResolvedValue({
      data: [
        {
          id: 5,
          data: '2026-07-18',
          tipo: 'mattina',
          reparto_id: 1,
          ora_inizio: '07:00:00',
          ora_fine: '14:00:00',
        },
      ],
    })
    const hook = useConsegneSbar()

    await hook.apriNuova()
    expect(hook.nuovaDialogOpen.value).toBe(true)
    expect(hook.assegnazioni.value).toHaveLength(1)
    expect(hook.assegnazioni.value[0].label).toContain('18/07/2026')

    vi.mocked(turniApi.getMieAssegnazioni).mockClear()
    await hook.apriNuova()
    expect(turniApi.getMieAssegnazioni).not.toHaveBeenCalled()
  })
})

describe('useConsegneSbar — salva', () => {
  it('creates a new SBAR consegna from the generic dialog, then reloads', async () => {
    vi.mocked(consegneSbarApi.createConsegnaSbar).mockResolvedValue({
      data: consegna(),
    })
    const hook = useConsegneSbar()
    hook.nuovaForm.value = {
      paziente_id: 1,
      tipo: 'sbar',
      data: '2026-07-18',
      turno_id: 5,
      priorita: 'normale',
      testo: 'Situation: S\nBackground: B\nAssessment: A\nRecommendation: R',
    }

    await hook.salvaNuova()

    expect(consegneSbarApi.createConsegnaSbar).toHaveBeenCalledOnce()
    expect(hook.nuovaDialogOpen.value).toBe(false)
  })

  it('creates a CEDEMA consegna from the generic dialog, then reloads', async () => {
    vi.mocked(diarioCedemaApi.createVoceDiarioCedema).mockResolvedValue({
      data: {} as never,
    })
    const hook = useConsegneSbar()
    hook.nuovaForm.value = {
      paziente_id: 1,
      tipo: 'cedema',
      data: '2026-07-18',
      turno_id: null,
      priorita: 'normale',
      testo: 'Paziente tranquillo.',
    }

    await hook.salvaNuova()

    expect(diarioCedemaApi.createVoceDiarioCedema).toHaveBeenCalledOnce()
  })

  it('is a no-op creating without paziente_id/turno_id', async () => {
    const hook = useConsegneSbar()
    hook.nuovaForm.value = {
      paziente_id: null,
      tipo: 'sbar',
      data: null,
      turno_id: null,
      priorita: 'normale',
      testo: 'S',
    }

    await hook.salvaNuova()

    expect(consegneSbarApi.createConsegnaSbar).not.toHaveBeenCalled()
  })

  it('updates instead of creating when editing', async () => {
    vi.mocked(consegneSbarApi.updateConsegnaSbar).mockResolvedValue({
      data: consegna(),
    })
    const hook = useConsegneSbar()
    hook.apriEdit(consegna())
    hook.form.value.situation = 'nuova situation'

    await hook.salva()

    expect(consegneSbarApi.updateConsegnaSbar).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ situation: 'nuova situation' }),
    )
    expect(consegneSbarApi.createConsegnaSbar).not.toHaveBeenCalled()
  })

  it('sets an error on failure', async () => {
    vi.mocked(consegneSbarApi.createConsegnaSbar).mockRejectedValue(
      new Error('down'),
    )
    const hook = useConsegneSbar()
    hook.nuovaForm.value = {
      paziente_id: 1,
      tipo: 'sbar',
      data: '2026-07-18',
      turno_id: 5,
      priorita: 'normale',
      testo: 'Situation: S',
    }

    await hook.salvaNuova()

    expect(hook.error.value).toBe('Impossibile salvare la consegna.')
  })
})
