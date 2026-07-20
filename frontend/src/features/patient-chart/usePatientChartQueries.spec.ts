import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePatientChartQueries } from '@/features/patient-chart/usePatientChartQueries'
import * as pazientiApi from '@/api/pazienti'
import * as turniApi from '@/api/turni'
import * as diarioCedemaApi from '@/api/diarioCedema'
import * as valutazioniApi from '@/api/valutazioni'
import * as consegneSbarApi from '@/api/consegneSbar'
import * as parametriVitaliApi from '@/api/parametriVitali'

vi.mock('@/api/pazienti')
vi.mock('@/api/turni')
vi.mock('@/api/diarioCedema')
vi.mock('@/api/valutazioni')
vi.mock('@/api/consegneSbar')
vi.mock('@/api/parametriVitali')

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
const cedema = [
  {
    id: 1,
    paziente_id: 1,
    turno_id: null,
    autore_id: 9,
    timestamp: '2026-07-18T10:00:00Z',
    coscienza: '',
    emotivita: '',
    dolore: '',
    emodinamica: '',
    mobilizzazione: '',
    allert: 'testo',
  },
]

beforeEach(() => {
  vi.mocked(pazientiApi.getPaziente).mockResolvedValue({ data: paziente })
  vi.mocked(diarioCedemaApi.listDiarioCedema).mockResolvedValue({
    data: cedema,
  })
  vi.mocked(consegneSbarApi.listConsegneSbarByPaziente).mockResolvedValue({
    data: [],
  })
  vi.mocked(valutazioniApi.getValutazioni).mockResolvedValue({
    data: { norton: [], conley: [] },
  })
  vi.mocked(parametriVitaliApi.listParametriVitali).mockResolvedValue({
    data: [],
  })
  vi.mocked(turniApi.getMieAssegnazioni).mockResolvedValue({ data: [] })
})

describe('usePatientChartQueries — load', () => {
  it('loads paziente, timeline, valutazioni and parametri vitali', async () => {
    const queries = usePatientChartQueries(1, 'caposala')

    await queries.load()

    expect(queries.paziente.value).toEqual(paziente)
    expect(queries.cedema.value).toEqual(cedema)
    expect(queries.sbar.value).toEqual([])
    expect(queries.parametriVitali.value).toEqual([])
    expect(queries.loading.value).toBe(false)
    expect(queries.error.value).toBe('')
  })

  it('also loads assegnazioni when ruolo is infermiere', async () => {
    const queries = usePatientChartQueries(1, 'infermiere')

    await queries.load()

    expect(turniApi.getMieAssegnazioni).toHaveBeenCalledOnce()
  })

  it('sets an error message on failure', async () => {
    vi.mocked(pazientiApi.getPaziente).mockRejectedValue(new Error('down'))
    const queries = usePatientChartQueries(1, 'caposala')

    await queries.load()

    expect(queries.error.value).toBe('Impossibile caricare la scheda paziente.')
    expect(queries.loading.value).toBe(false)
  })
})

describe('usePatientChartQueries — reload helpers', () => {
  it('reloadTimeline refreshes cedema and sbar', async () => {
    vi.mocked(consegneSbarApi.listConsegneSbarByPaziente).mockResolvedValue({
      data: [{ id: 2 } as never],
    })
    const queries = usePatientChartQueries(1, 'caposala')

    await queries.reloadTimeline()

    expect(queries.cedema.value).toEqual(cedema)
    expect(queries.sbar.value).toEqual([{ id: 2 }])
  })

  it('reloadValutazioni refreshes norton and conley', async () => {
    vi.mocked(valutazioniApi.getValutazioni).mockResolvedValue({
      data: { norton: [{ id: 1 } as never], conley: [] },
    })
    const queries = usePatientChartQueries(1, 'caposala')

    await queries.reloadValutazioni()

    expect(queries.norton.value).toEqual([{ id: 1 }])
    expect(queries.conley.value).toEqual([])
  })

  it('reloadParametriVitali refreshes only vitali', async () => {
    vi.mocked(parametriVitaliApi.listParametriVitali).mockResolvedValue({
      data: [{ id: 1 } as never],
    })
    const queries = usePatientChartQueries(1, 'caposala')

    await queries.reloadParametriVitali()

    expect(queries.parametriVitali.value).toEqual([{ id: 1 }])
  })
})
