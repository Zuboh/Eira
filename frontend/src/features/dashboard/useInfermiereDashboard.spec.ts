import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useInfermiereDashboard } from '@/features/dashboard/useInfermiereDashboard'
import * as carelloFarmaciApi from '@/api/carelloFarmaci'
import * as cambiTurnoApi from '@/api/cambiTurno'
import * as consegneSbarApi from '@/api/consegneSbar'
import * as pazientiApi from '@/api/pazienti'
import * as turniApi from '@/api/turni'
import * as utentiApi from '@/api/utenti'

vi.mock('@/api/carelloFarmaci')
vi.mock('@/api/cambiTurno')
vi.mock('@/api/consegneSbar')
vi.mock('@/api/pazienti')
vi.mock('@/api/turni')
vi.mock('@/api/utenti')

const FUTURO_1 = '2030-01-01'

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

beforeEach(() => {
  vi.mocked(carelloFarmaciApi.listCarelloFarmaci).mockResolvedValue({
    data: [],
  })
  vi.mocked(cambiTurnoApi.listCambiTurno).mockResolvedValue({ data: [] })
  vi.mocked(consegneSbarApi.listConsegneSbar).mockResolvedValue({
    data: { items: [], total: 0 },
  })
  vi.mocked(pazientiApi.listPazienti).mockResolvedValue({ data: [] })
  vi.mocked(turniApi.getMieiProssimiTurni).mockResolvedValue({ data: [] })
  vi.mocked(utentiApi.listUtenti).mockResolvedValue({ data: [] })
})

describe('useInfermiereDashboard — prossimiTurniConColleghi', () => {
  it('loads prossimi turni con colleghi from the dedicated API', async () => {
    const turnoFuturo = turno(3, FUTURO_1)
    vi.mocked(turniApi.getMieiProssimiTurni).mockResolvedValue({
      data: [
        {
          turno: turnoFuturo,
          colleghi: [
            { id: 2, nome: 'Anna', cognome: 'Rossi', ruolo: 'infermiere' },
          ],
        },
      ],
    })
    const dash = useInfermiereDashboard()

    await dash.load()

    expect(turniApi.getMieiProssimiTurni).toHaveBeenCalledWith({ limit: 60 })
    expect(dash.prossimiTurniConColleghi.value).toEqual([
      {
        turno: turnoFuturo,
        colleghi: [
          { id: 2, nome: 'Anna', cognome: 'Rossi', ruolo: 'infermiere' },
        ],
      },
    ])
  })

  it('uses the full response for calendar events and first four rows for prossimi turni', async () => {
    vi.mocked(turniApi.getMieiProssimiTurni).mockResolvedValue({
      data: Array.from({ length: 5 }, (_, index) => ({
        turno: turno(index + 1, `2030-01-0${index + 1}`),
        colleghi: [],
      })),
    })
    const dash = useInfermiereDashboard()

    await dash.load()

    expect(dash.prossimiTurniConColleghi.value).toHaveLength(4)
    expect(dash.calendarEvents.value).toHaveLength(5)
  })

  it('sets an error message when loading fails', async () => {
    vi.mocked(turniApi.getMieiProssimiTurni).mockRejectedValue(
      new Error('down'),
    )
    const dash = useInfermiereDashboard()

    await dash.load()

    expect(dash.error.value).toBe('Impossibile caricare la dashboard.')
  })
})

describe('useInfermiereDashboard — consegneRecenti / pazientiAttivi', () => {
  it('caps consegne at 5 (already sliced by the API layer) and filters out dimessi pazienti', async () => {
    vi.mocked(carelloFarmaciApi.listCarelloFarmaci).mockResolvedValue({
      data: [],
    })
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

describe('useInfermiereDashboard — nomeUtente', () => {
  it('mostra cognome e nome del richiedente', async () => {
    vi.mocked(utentiApi.listUtenti).mockResolvedValue({
      data: [
        {
          id: 3,
          nome: 'Marco',
          cognome: 'Rossi',
          email: 'marco.rossi@example.com',
          ruolo: 'infermiere',
          reparto_id: 1,
          stato: 'attivo',
        },
      ],
    })
    const dash = useInfermiereDashboard()

    await dash.load()

    expect(dash.nomeUtente(3)).toBe('Rossi Marco')
    expect(dash.nomeUtente(99)).toBe('#99')
  })
})

describe('useInfermiereDashboard — farmaciCritici', () => {
  it('include solo farmaci sotto soglia e ignora la scadenza singola del farmaco', async () => {
    vi.mocked(carelloFarmaciApi.listCarelloFarmaci).mockResolvedValue({
      data: [
        {
          id: 1,
          farmaco_id: 10,
          reparto_id: 1,
          quantita: 4,
          soglia_minima: 5,
          prossima_scadenza: null,
          farmaco: {
            id: 10,
            nome: 'Paracetamolo',
            unita_misura: 'compresse',
            categoria: 'Analgesici',
          },
        },
        {
          id: 2,
          farmaco_id: 11,
          reparto_id: 1,
          quantita: 8,
          soglia_minima: 5,
          prossima_scadenza: '2020-01-01',
          farmaco: {
            id: 11,
            nome: 'Ibuprofene',
            unita_misura: 'compresse',
            categoria: 'Antinfiammatori',
          },
        },
      ],
    })
    const dash = useInfermiereDashboard()

    await dash.load()

    expect(dash.farmaciCritici.value.map((farmaco) => farmaco.id)).toEqual([1])
  })
})

describe('useInfermiereDashboard — richiesteCambioTurno', () => {
  it('mostra al massimo tre richieste in attesa di approvazione', async () => {
    vi.mocked(cambiTurnoApi.listCambiTurno).mockResolvedValue({
      data: [
        ...Array.from({ length: 4 }, (_, index) => ({
          id: index + 1,
          assegnazione_turno_id: index + 10,
          assegnazione_collega_id: index + 20,
          richiedente_id: 2,
          collega_id: 3,
          turno_richiedente: turno(index + 10, `2030-01-0${index + 1}`),
          turno_collega: turno(
            index + 20,
            `2030-01-0${index + 1}`,
            'pomeriggio',
          ),
          stato: 'in_attesa_caposala' as const,
          creata_il: `2030-01-0${index + 1}T10:00:00Z`,
          risposta_collega_il: `2030-01-0${index + 1}T11:00:00Z`,
          risposta_caposala_id: null,
          risposta_caposala_il: null,
          motivo_rifiuto: null,
        })),
        {
          id: 5,
          assegnazione_turno_id: 30,
          assegnazione_collega_id: 31,
          richiedente_id: 2,
          collega_id: 3,
          turno_richiedente: turno(30, '2030-01-05'),
          turno_collega: turno(31, '2030-01-05', 'pomeriggio'),
          stato: 'approvata',
          creata_il: '2030-01-05T10:00:00Z',
          risposta_collega_il: '2030-01-05T11:00:00Z',
          risposta_caposala_id: 1,
          risposta_caposala_il: '2030-01-05T12:00:00Z',
          motivo_rifiuto: null,
        },
      ],
    })
    const dash = useInfermiereDashboard()

    await dash.load()

    expect(cambiTurnoApi.listCambiTurno).toHaveBeenCalledOnce()
    expect(
      dash.richiesteCambioTurno.value.map((richiesta) => richiesta.id),
    ).toEqual([1, 2, 3])
  })
})
