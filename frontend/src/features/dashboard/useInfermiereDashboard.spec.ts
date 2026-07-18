import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useInfermiereDashboard } from '@/features/dashboard/useInfermiereDashboard'
import * as consegneSbarApi from '@/api/consegneSbar'
import * as pazientiApi from '@/api/pazienti'
import * as turniApi from '@/api/turni'

vi.mock('@/api/consegneSbar')
vi.mock('@/api/pazienti')
vi.mock('@/api/turni')

const PASSATO = '2020-01-01'
const FUTURO_1 = '2030-01-01'
const FUTURO_2 = '2030-01-02'
const FUTURO_3 = '2030-01-03'
const FUTURO_4 = '2030-01-04'
const FUTURO_5 = '2030-01-05'

function turno(
  id: number,
  data: string,
  tipo: 'mattina' | 'pomeriggio' | 'notte' = 'mattina',
) {
  return {
    id,
    data,
    tipo,
    reparto_id: 1,
    ora_inizio: '07:00:00',
    ora_fine: '14:00:00',
  }
}

function assegnazione(
  id: number,
  turnoId: number,
  stato: 'attiva' | 'cambiata' = 'attiva',
) {
  return { id, turno_id: turnoId, infermiere_id: 9, stato }
}

beforeEach(() => {
  vi.mocked(consegneSbarApi.listConsegneSbar).mockResolvedValue({
    data: { items: [], total: 0 },
  })
  vi.mocked(pazientiApi.listPazienti).mockResolvedValue({ data: [] })
  vi.mocked(turniApi.getMieAssegnazioni).mockResolvedValue({ data: [] })
  vi.mocked(turniApi.listTurni).mockResolvedValue({ data: [] })
})

describe('useInfermiereDashboard — mieiTurni', () => {
  it('excludes past turni, non-attiva assegnazioni, sorts by date, and caps at 4', async () => {
    vi.mocked(turniApi.listTurni).mockResolvedValue({
      data: [
        turno(1, PASSATO),
        turno(2, FUTURO_3),
        turno(3, FUTURO_1),
        turno(4, FUTURO_5),
        turno(5, FUTURO_2),
        turno(6, FUTURO_4),
      ],
    })
    vi.mocked(turniApi.getMieAssegnazioni).mockResolvedValue({
      data: [
        assegnazione(1, 1),
        assegnazione(2, 2),
        assegnazione(3, 3),
        assegnazione(4, 4),
        assegnazione(5, 5),
        assegnazione(6, 6, 'cambiata'),
      ],
    })
    const dash = useInfermiereDashboard()

    await dash.load()

    expect(dash.mieiTurni.value.map((t) => t.data)).toEqual([
      FUTURO_1,
      FUTURO_2,
      FUTURO_3,
      FUTURO_5,
    ])
  })

  it('sets an error message when loading fails', async () => {
    vi.mocked(turniApi.listTurni).mockRejectedValue(new Error('down'))
    const dash = useInfermiereDashboard()

    await dash.load()

    expect(dash.error.value).toBe('Impossibile caricare la dashboard.')
  })
})

describe('useInfermiereDashboard — consegneRecenti / pazientiAttivi', () => {
  it('caps consegne at 5 (already sliced by the API layer) and filters out dimessi pazienti', async () => {
    vi.mocked(consegneSbarApi.listConsegneSbar).mockResolvedValue({
      data: {
        items: [
          {
            id: 1,
            paziente_id: 1,
            turno_id: 1,
            autore_id: 9,
            situation: 'S',
            background: 'B',
            assessment: 'A',
            recommendation: 'R',
            priorita: 'normale',
            creata_il: '2026-07-18T10:00:00Z',
          },
        ],
        total: 1,
      },
    })
    vi.mocked(pazientiApi.listPazienti).mockResolvedValue({
      data: [
        {
          id: 1,
          nome: 'Mario',
          cognome: 'Bianchi',
          eta: 70,
          letto: '1',
          data_ricovero: '2026-07-01',
          diagnosi_ingresso: 'x',
          reparto_id: 1,
          dimesso: false,
        },
        {
          id: 2,
          nome: 'Luigi',
          cognome: 'Verdi',
          eta: 60,
          letto: '2',
          data_ricovero: '2026-06-01',
          diagnosi_ingresso: 'y',
          reparto_id: 1,
          dimesso: true,
        },
      ],
    })
    const dash = useInfermiereDashboard()

    await dash.load()

    expect(dash.consegneRecenti.value).toHaveLength(1)
    expect(dash.pazientiAttivi.value.map((p) => p.id)).toEqual([1])
  })
})

describe('useInfermiereDashboard — nomePaziente', () => {
  it('resolves a known paziente to "cognome nome", falls back to "#id" otherwise', async () => {
    vi.mocked(pazientiApi.listPazienti).mockResolvedValue({
      data: [
        {
          id: 1,
          nome: 'Mario',
          cognome: 'Bianchi',
          eta: 70,
          letto: '1',
          data_ricovero: '2026-07-01',
          diagnosi_ingresso: 'x',
          reparto_id: 1,
          dimesso: false,
        },
      ],
    })
    const dash = useInfermiereDashboard()
    await dash.load()

    expect(dash.nomePaziente(1)).toBe('Bianchi Mario')
    expect(dash.nomePaziente(99)).toBe('#99')
  })
})
