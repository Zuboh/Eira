import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSbarCreateDialog } from '@/features/sbar/useSbarCreateDialog'
import * as consegneSbarApi from '@/api/consegneSbar'
import * as turniApi from '@/api/turni'

vi.mock('@/api/consegneSbar')
vi.mock('@/api/turni')

beforeEach(() => {
  vi.mocked(turniApi.getMieAssegnazioni).mockResolvedValue({ data: [] })
})

describe('useSbarCreateDialog — apri', () => {
  it('opens with the form pre-filled to the given paziente and loads assegnazioni', async () => {
    vi.mocked(turniApi.getMieAssegnazioni).mockResolvedValue({
      data: [{ id: 1, turno_id: 5, infermiere_id: 9, stato: 'attiva' }],
    })
    const onCreated = vi.fn()
    const dialog = useSbarCreateDialog({ pazienteId: 7, onCreated })

    await dialog.apri()

    expect(dialog.dialogOpen.value).toBe(true)
    expect(dialog.form.value.paziente_id).toBe(7)
    expect(dialog.assegnazioni.value).toHaveLength(1)
  })

  it('only loads assegnazioni once it has a non-empty result, across repeated opens', async () => {
    vi.mocked(turniApi.getMieAssegnazioni).mockResolvedValue({
      data: [{ id: 1, turno_id: 5, infermiere_id: 9, stato: 'attiva' }],
    })
    const onCreated = vi.fn()
    const dialog = useSbarCreateDialog({ pazienteId: 7, onCreated })

    await dialog.apri()
    vi.mocked(turniApi.getMieAssegnazioni).mockClear()
    await dialog.apri()

    expect(turniApi.getMieAssegnazioni).not.toHaveBeenCalled()
  })

  it('sets an error when loading assegnazioni fails', async () => {
    vi.mocked(turniApi.getMieAssegnazioni).mockRejectedValue(new Error('down'))
    const onCreated = vi.fn()
    const dialog = useSbarCreateDialog({ pazienteId: 7, onCreated })

    await dialog.apri()

    expect(dialog.error.value).toBe('Impossibile caricare i turni assegnati.')
  })
})

describe('useSbarCreateDialog — salva', () => {
  it('is a no-op without paziente_id/turno_id set', async () => {
    const onCreated = vi.fn()
    const dialog = useSbarCreateDialog({ pazienteId: 7, onCreated })

    await dialog.salva()

    expect(consegneSbarApi.createConsegnaSbar).not.toHaveBeenCalled()
  })

  it('creates the consegna, closes the dialog, and calls onCreated on success', async () => {
    vi.mocked(consegneSbarApi.createConsegnaSbar).mockResolvedValue({
      data: {
        id: 1,
        paziente_id: 7,
        turno_id: 5,
        autore_id: 9,
        situation: 'S',
        background: 'B',
        assessment: 'A',
        recommendation: 'R',
        priorita: 'normale',
        creata_il: '2026-07-18T10:00:00Z',
      },
    })
    const onCreated = vi.fn()
    const dialog = useSbarCreateDialog({ pazienteId: 7, onCreated })
    dialog.form.value = {
      paziente_id: 7,
      turno_id: 5,
      situation: 'S',
      background: 'B',
      assessment: 'A',
      recommendation: 'R',
      priorita: 'normale',
    }

    await dialog.salva()

    expect(consegneSbarApi.createConsegnaSbar).toHaveBeenCalledOnce()
    expect(dialog.dialogOpen.value).toBe(false)
    expect(onCreated).toHaveBeenCalledOnce()
  })

  it('sets an error and keeps saving false on failure', async () => {
    vi.mocked(consegneSbarApi.createConsegnaSbar).mockRejectedValue(
      new Error('down'),
    )
    const onCreated = vi.fn()
    const dialog = useSbarCreateDialog({ pazienteId: 7, onCreated })
    dialog.form.value = {
      paziente_id: 7,
      turno_id: 5,
      situation: 'S',
      background: 'B',
      assessment: 'A',
      recommendation: 'R',
      priorita: 'normale',
    }

    await dialog.salva()

    expect(dialog.error.value).toBe('Impossibile salvare la consegna.')
    expect(dialog.saving.value).toBe(false)
    expect(onCreated).not.toHaveBeenCalled()
  })
})
