import { describe, expect, it, vi, beforeEach } from 'vitest'
import { usePatientChartQueries } from '@/features/patient-chart/usePatientChartQueries'
import * as pazientiApi from '@/api/pazienti'
import * as turniApi from '@/api/turni'
import * as diarioCedemaApi from '@/api/diarioCedema'
import * as valutazioniApi from '@/api/valutazioni'

vi.mock('@/api/pazienti')
vi.mock('@/api/turni')
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
    allert: '',
  },
]

beforeEach(() => {
  vi.mocked(pazientiApi.getPaziente).mockResolvedValue({ data: paziente })
  vi.mocked(diarioCedemaApi.listDiarioCedema).mockResolvedValue({
    data: cedema,
  })
  vi.mocked(valutazioniApi.getValutazioni).mockResolvedValue({
    data: { norton: [], conley: [] },
  })
  vi.mocked(turniApi.getMieAssegnazioni).mockResolvedValue({ data: [] })
})

describe('usePatientChartQueries — load', () => {
  it('loads paziente, cedema and valutazioni', async () => {
    const queries = usePatientChartQueries(1, 'caposala')

    await queries.load()

    expect(queries.paziente.value).toEqual(paziente)
    expect(queries.cedema.value).toEqual(cedema)
    expect(queries.loading.value).toBe(false)
    expect(queries.error.value).toBe('')
  })

  it('also loads assegnazioni when ruolo is infermiere', async () => {
    const queries = usePatientChartQueries(1, 'infermiere')

    await queries.load()

    expect(turniApi.getMieAssegnazioni).toHaveBeenCalledOnce()
  })

  it('skips assegnazioni when ruolo is not infermiere', async () => {
    const queries = usePatientChartQueries(1, 'caposala')

    await queries.load()

    expect(turniApi.getMieAssegnazioni).not.toHaveBeenCalled()
  })

  it('sets an error message on failure', async () => {
    vi.mocked(pazientiApi.getPaziente).mockRejectedValue(new Error('down'))
    const queries = usePatientChartQueries(1, 'caposala')

    await queries.load()

    expect(queries.error.value).toBe('Impossibile caricare la scheda paziente.')
    expect(queries.loading.value).toBe(false)
  })
})

describe('usePatientChartQueries — reloadCedema / reloadValutazioni', () => {
  it('reloadCedema refreshes only cedema', async () => {
    const queries = usePatientChartQueries(1, 'caposala')

    await queries.reloadCedema()

    expect(queries.cedema.value).toEqual(cedema)
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
})
