import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useFerie } from '@/features/ferie/useFerie'
import { useAuthStore } from '@/stores/auth'
import * as ferieApi from '@/api/ferie'
import * as utentiApi from '@/api/utenti'
import type { RichiestaFerie } from '@/api/ferie'

vi.mock('@/api/ferie')
vi.mock('@/api/utenti')

const infermiere = {
  id: 9,
  email: 'x@x.it',
  nome: 'Anna',
  cognome: 'Rossi',
  ruolo: 'infermiere' as const,
  reparto_id: 1,
}

function richiesta(overrides: Partial<RichiestaFerie> = {}): RichiestaFerie {
  return {
    id: 1,
    infermiere_id: infermiere.id,
    data_inizio: null,
    data_fine: null,
    preferenze: [
      { rank: 1, data_inizio: '2026-08-01', data_fine: '2026-08-07' },
    ],
    stato: 'in_attesa',
    creata_il: '2026-07-18T10:00:00Z',
    risposta_caposala_id: null,
    risposta_caposala_il: null,
    motivo_rifiuto: null,
    ...overrides,
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.mocked(ferieApi.listRichiesteFerie).mockResolvedValue({ data: [] })
  vi.mocked(ferieApi.listSlotFerieDisponibili).mockResolvedValue({ data: [] })
  vi.mocked(utentiApi.listUtenti).mockResolvedValue({ data: [] })
})

describe('useFerie — load and canRequestFerie', () => {
  it('an infermiere with no active request can request ferie', async () => {
    useAuthStore().user = infermiere
    vi.mocked(ferieApi.listRichiesteFerie).mockResolvedValue({ data: [] })
    const ferie = useFerie()

    await ferie.load()

    expect(ferie.canRequestFerie.value).toBe(true)
  })

  it('an infermiere with an active (in_attesa/approvata) request cannot request again', async () => {
    useAuthStore().user = infermiere
    vi.mocked(ferieApi.listRichiesteFerie).mockResolvedValue({
      data: [richiesta({ stato: 'approvata' })],
    })
    const ferie = useFerie()

    await ferie.load()

    expect(ferie.canRequestFerie.value).toBe(false)
  })

  it('a caposala can never request ferie regardless of existing requests', async () => {
    useAuthStore().user = { ...infermiere, ruolo: 'caposala' }
    const ferie = useFerie()

    await ferie.load()

    expect(ferie.canRequestFerie.value).toBe(false)
  })

  it('sets an error message when loading fails', async () => {
    vi.mocked(ferieApi.listRichiesteFerie).mockRejectedValue(new Error('down'))
    const ferie = useFerie()

    await ferie.load()

    expect(ferie.error.value).toBe(
      'Impossibile caricare le richieste di ferie.',
    )
  })
})

describe('useFerie — salva (create/update)', () => {
  it('creates a request from non-null preferenze and reloads', async () => {
    vi.mocked(ferieApi.createRichiestaFerie).mockResolvedValue({
      data: richiesta(),
    })
    const ferie = useFerie()
    ferie.preferenzeSelezionate.value = ['2026-08-01', null]

    await ferie.salva()

    expect(ferieApi.createRichiestaFerie).toHaveBeenCalledWith({
      preferenze: ['2026-08-01'],
    })
    expect(ferieApi.listRichiesteFerie).toHaveBeenCalledOnce()
  })

  it('is a no-op when every preferenza slot is empty', async () => {
    const ferie = useFerie()
    ferie.preferenzeSelezionate.value = [null]

    await ferie.salva()

    expect(ferieApi.createRichiestaFerie).not.toHaveBeenCalled()
  })

  it('updates instead of creating when editingId is set', async () => {
    vi.mocked(ferieApi.updateRichiestaFerie).mockResolvedValue({
      data: richiesta(),
    })
    const ferie = useFerie()
    ferie.avviaModifica(richiesta())
    ferie.preferenzeSelezionate.value = ['2026-08-02']

    await ferie.salva()

    expect(ferieApi.updateRichiestaFerie).toHaveBeenCalledWith(1, {
      preferenze: ['2026-08-02'],
    })
    expect(ferieApi.createRichiestaFerie).not.toHaveBeenCalled()
  })

  it('sets an error and keeps state on failure', async () => {
    vi.mocked(ferieApi.createRichiestaFerie).mockRejectedValue(
      new Error('down'),
    )
    const ferie = useFerie()
    ferie.preferenzeSelezionate.value = ['2026-08-01']

    await ferie.salva()

    expect(ferie.error.value).toBe('Impossibile salvare la richiesta di ferie.')
  })
})

describe('useFerie — avviaModifica', () => {
  it('sorts preferenze by rank and loads them into the form', () => {
    const ferie = useFerie()
    const r = richiesta({
      preferenze: [
        { rank: 2, data_inizio: '2026-08-15', data_fine: '2026-08-21' },
        { rank: 1, data_inizio: '2026-08-01', data_fine: '2026-08-07' },
      ],
    })

    ferie.avviaModifica(r)

    expect(ferie.editingId.value).toBe(r.id)
    expect(ferie.preferenzeSelezionate.value).toEqual([
      '2026-08-01',
      '2026-08-15',
    ])
  })
})

describe('useFerie — approvazione e rifiuto', () => {
  it('confermaApprova sends the chosen rank and closes the dialog on success', async () => {
    vi.mocked(ferieApi.rispondiFerie).mockResolvedValue({
      data: richiesta({ stato: 'approvata' }),
    })
    const ferie = useFerie()
    ferie.apriApprova(richiesta())

    await ferie.confermaApprova(1)

    expect(ferieApi.rispondiFerie).toHaveBeenCalledWith(1, {
      accetta: true,
      preferenza_rank: 1,
    })
    expect(ferie.approvaDialog.value).toBe(false)
  })

  it('confermaRifiuto sends the motivo and closes the dialog on success', async () => {
    vi.mocked(ferieApi.rispondiFerie).mockResolvedValue({
      data: richiesta({ stato: 'rifiutata' }),
    })
    const ferie = useFerie()
    ferie.apriRifiuto(richiesta())
    ferie.motivoRifiuto.value = 'Copertura insufficiente'

    await ferie.confermaRifiuto()

    expect(ferieApi.rispondiFerie).toHaveBeenCalledWith(1, {
      accetta: false,
      motivo_rifiuto: 'Copertura insufficiente',
    })
    expect(ferie.rifiutoDialog.value).toBe(false)
  })

  it('confermaRifiuto sets an error on failure', async () => {
    vi.mocked(ferieApi.rispondiFerie).mockRejectedValue(new Error('down'))
    const ferie = useFerie()
    ferie.apriRifiuto(richiesta())

    await ferie.confermaRifiuto()

    expect(ferie.error.value).toBe('Impossibile rifiutare la richiesta.')
  })
})

describe('useFerie — cancella', () => {
  it('deletes the request, resets the form if it was being edited, and reloads', async () => {
    vi.mocked(ferieApi.deleteRichiestaFerie).mockResolvedValue(undefined)
    const ferie = useFerie()
    const r = richiesta()
    ferie.avviaModifica(r)

    await ferie.cancella(r)

    expect(ferieApi.deleteRichiestaFerie).toHaveBeenCalledWith(r.id)
    expect(ferie.editingId.value).toBeNull()
    expect(ferieApi.listRichiesteFerie).toHaveBeenCalledOnce()
  })
})
