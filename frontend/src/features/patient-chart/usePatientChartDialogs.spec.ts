import { ref } from 'vue'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { usePatientChartDialogs } from '@/features/patient-chart/usePatientChartDialogs'
import * as pazientiApi from '@/api/pazienti'
import * as diarioCedemaApi from '@/api/diarioCedema'
import * as valutazioniApi from '@/api/valutazioni'

vi.mock('@/api/pazienti')
vi.mock('@/api/diarioCedema')
vi.mock('@/api/valutazioni')

const paziente = {
  id: 1,
  nome: 'Mario',
  cognome: 'Bianchi',
  eta: 70,
  letto: '3B',
  data_ricovero: '2026-07-01',
  diagnosi_ingresso: 'Frattura femore',
  reparto_id: 1,
  dimesso: false,
}

function makeDialogs() {
  const reloadCedema = vi.fn().mockResolvedValue(undefined)
  const reloadValutazioni = vi.fn().mockResolvedValue(undefined)
  const dialogs = usePatientChartDialogs({
    pazienteId: 1,
    paziente: ref(paziente),
    error: ref(''),
    reloadCedema,
    reloadValutazioni,
  })
  return { dialogs, reloadCedema, reloadValutazioni }
}

beforeEach(() => {
  vi.mocked(pazientiApi.updatePaziente).mockResolvedValue({ data: paziente })
})

describe('usePatientChartDialogs — edit', () => {
  it('apriEdit populates the form from the current paziente', () => {
    const { dialogs } = makeDialogs()

    dialogs.apriEdit()

    expect(dialogs.editing.value).toBe(true)
    expect(dialogs.editForm.value).toEqual({
      letto: '3B',
      diagnosi_ingresso: 'Frattura femore',
      dimesso: false,
    })
  })

  it('salvaEdit updates paziente and closes the dialog', async () => {
    const { dialogs } = makeDialogs()
    dialogs.apriEdit()

    await dialogs.salvaEdit()

    expect(pazientiApi.updatePaziente).toHaveBeenCalledWith(
      1,
      dialogs.editForm.value,
    )
    expect(dialogs.editing.value).toBe(false)
  })
})

describe('usePatientChartDialogs — cedema', () => {
  it('salvaCedema saves, closes the dialog, and reloads cedema on success', async () => {
    vi.mocked(diarioCedemaApi.createVoceDiarioCedema).mockResolvedValue({
      data: {} as never,
    })
    const { dialogs, reloadCedema } = makeDialogs()
    dialogs.apriCedema()

    await dialogs.salvaCedema()

    expect(diarioCedemaApi.createVoceDiarioCedema).toHaveBeenCalledOnce()
    expect(dialogs.cedemaDialog.value).toBe(false)
    expect(dialogs.cedemaSaving.value).toBe(false)
    expect(reloadCedema).toHaveBeenCalledOnce()
  })

  it('salvaCedema sets an error and keeps the dialog open on failure', async () => {
    vi.mocked(diarioCedemaApi.createVoceDiarioCedema).mockRejectedValue(
      new Error('down'),
    )
    const { dialogs } = makeDialogs()
    dialogs.apriCedema()

    await dialogs.salvaCedema()

    expect(dialogs.cedemaDialog.value).toBe(true)
    expect(dialogs.cedemaSaving.value).toBe(false)
  })
})

describe('usePatientChartDialogs — norton', () => {
  it('salvaNorton saves, closes the dialog, and reloads valutazioni on success', async () => {
    vi.mocked(valutazioniApi.createNorton).mockResolvedValue({
      data: {} as never,
    })
    const { dialogs, reloadValutazioni } = makeDialogs()
    dialogs.apriNorton()

    await dialogs.salvaNorton()

    expect(valutazioniApi.createNorton).toHaveBeenCalledOnce()
    expect(dialogs.nortonDialog.value).toBe(false)
    expect(reloadValutazioni).toHaveBeenCalledOnce()
  })

  it('salvaNorton sets an error on failure', async () => {
    vi.mocked(valutazioniApi.createNorton).mockRejectedValue(new Error('down'))
    const { dialogs } = makeDialogs()

    await dialogs.salvaNorton()

    expect(dialogs.nortonSaving.value).toBe(false)
  })
})

describe('usePatientChartDialogs — conley', () => {
  it('salvaConley saves, closes the dialog, and reloads valutazioni on success', async () => {
    vi.mocked(valutazioniApi.createConley).mockResolvedValue({
      data: {} as never,
    })
    const { dialogs, reloadValutazioni } = makeDialogs()
    dialogs.apriConley()

    await dialogs.salvaConley()

    expect(valutazioniApi.createConley).toHaveBeenCalledOnce()
    expect(dialogs.conleyDialog.value).toBe(false)
    expect(reloadValutazioni).toHaveBeenCalledOnce()
  })

  it('salvaConley sets an error on failure', async () => {
    vi.mocked(valutazioniApi.createConley).mockRejectedValue(new Error('down'))
    const { dialogs } = makeDialogs()

    await dialogs.salvaConley()

    expect(dialogs.conleySaving.value).toBe(false)
  })
})
