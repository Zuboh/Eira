import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePatientChartDialogs } from '@/features/patient-chart/usePatientChartDialogs'
import * as pazientiApi from '@/api/pazienti'
import * as diarioCedemaApi from '@/api/diarioCedema'
import * as consegneSbarApi from '@/api/consegneSbar'
import * as parametriVitaliApi from '@/api/parametriVitali'
import * as valutazioniApi from '@/api/valutazioni'

vi.mock('@/api/pazienti')
vi.mock('@/api/diarioCedema')
vi.mock('@/api/consegneSbar')
vi.mock('@/api/parametriVitali')
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
  const reloadTimeline = vi.fn().mockResolvedValue(undefined)
  const reloadValutazioni = vi.fn().mockResolvedValue(undefined)
  const reloadParametriVitali = vi.fn().mockResolvedValue(undefined)
  const dialogs = usePatientChartDialogs({
    pazienteId: 1,
    paziente: ref(paziente),
    error: ref(''),
    assegnazioni: ref([]),
    reloadTimeline,
    reloadValutazioni,
    reloadParametriVitali,
  })
  return { dialogs, reloadTimeline, reloadValutazioni, reloadParametriVitali }
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
})

describe('usePatientChartDialogs — generic consegna', () => {
  it('salvaConsegna saves SBAR and reloads timeline on success', async () => {
    vi.mocked(consegneSbarApi.createConsegnaSbar).mockResolvedValue({
      data: {} as never,
    })
    const { dialogs, reloadTimeline } = makeDialogs()
    dialogs.apriConsegna()
    dialogs.consegnaForm.value.testo = 'Situation: dolore acuto'
    dialogs.consegnaForm.value.turno_id = 7

    await dialogs.salvaConsegna()

    expect(consegneSbarApi.createConsegnaSbar).toHaveBeenCalledOnce()
    expect(dialogs.consegnaDrawer.value).toBe(false)
    expect(reloadTimeline).toHaveBeenCalledOnce()
  })

  it('salvaConsegna saves CEDEMA and reloads timeline on success', async () => {
    vi.mocked(diarioCedemaApi.createVoceDiarioCedema).mockResolvedValue({
      data: {} as never,
    })
    const { dialogs, reloadTimeline } = makeDialogs()
    dialogs.apriConsegna()
    dialogs.consegnaForm.value.tipo = 'cedema'
    dialogs.consegnaForm.value.testo = 'Paziente tranquillo e collaborante.'

    await dialogs.salvaConsegna()

    expect(diarioCedemaApi.createVoceDiarioCedema).toHaveBeenCalledOnce()
    expect(reloadTimeline).toHaveBeenCalledOnce()
  })

  it('salvaConsegna blocks empty text', async () => {
    const { dialogs } = makeDialogs()
    dialogs.apriConsegna()

    await dialogs.salvaConsegna()

    expect(consegneSbarApi.createConsegnaSbar).not.toHaveBeenCalled()
    expect(dialogs.consegnaSaving.value).toBe(false)
  })
})

describe('usePatientChartDialogs — parametri vitali', () => {
  it('salvaParametri saves and reloads parametri vitali on success', async () => {
    vi.mocked(parametriVitaliApi.createParametriVitali).mockResolvedValue({
      data: {} as never,
    })
    const { dialogs, reloadParametriVitali } = makeDialogs()
    dialogs.apriParametri()

    await dialogs.salvaParametri()

    expect(parametriVitaliApi.createParametriVitali).toHaveBeenCalledOnce()
    expect(dialogs.parametriDialog.value).toBe(false)
    expect(reloadParametriVitali).toHaveBeenCalledOnce()
  })
})

describe('usePatientChartDialogs — valutazioni', () => {
  it('salvaNorton saves and reloads valutazioni on success', async () => {
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

  it('salvaConley saves and reloads valutazioni on success', async () => {
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
})
