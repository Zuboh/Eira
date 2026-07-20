import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePatientChart } from '@/features/patient-chart/usePatientChart'
import { useAuthStore } from '@/stores/auth'
import * as pazientiApi from '@/api/pazienti'
import * as turniApi from '@/api/turni'
import * as diarioCedemaApi from '@/api/diarioCedema'
import * as parametriVitaliApi from '@/api/parametriVitali'
import * as valutazioniApi from '@/api/valutazioni'
import * as consegneSbarApi from '@/api/consegneSbar'

vi.mock('@/api/pazienti')
vi.mock('@/api/turni')
vi.mock('@/api/diarioCedema')
vi.mock('@/api/parametriVitali')
vi.mock('@/api/valutazioni')
vi.mock('@/api/consegneSbar')

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

beforeEach(() => {
  setActivePinia(createPinia())
  vi.mocked(pazientiApi.getPaziente).mockResolvedValue({ data: paziente })
  vi.mocked(diarioCedemaApi.listDiarioCedema).mockResolvedValue({ data: [] })
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

describe('usePatientChart — load', () => {
  it('loads assegnazioni for an infermiere but not for a caposala', async () => {
    const auth = useAuthStore()
    auth.user = {
      id: 9,
      email: 'x@x.it',
      nome: 'X',
      cognome: 'Y',
      ruolo: 'infermiere',
      reparto_id: 1,
    }

    const chart = usePatientChart(1)
    await chart.load()

    expect(turniApi.getMieAssegnazioni).toHaveBeenCalledOnce()
    expect(chart.paziente.value).toEqual(paziente)

    vi.mocked(turniApi.getMieAssegnazioni).mockClear()
    auth.user = {
      id: 9,
      email: 'x@x.it',
      nome: 'X',
      cognome: 'Y',
      ruolo: 'caposala',
      reparto_id: 1,
    }

    await chart.load()

    expect(turniApi.getMieAssegnazioni).not.toHaveBeenCalled()
  })

  it('builds a unified timeline from cedema and sbar', async () => {
    vi.mocked(diarioCedemaApi.listDiarioCedema).mockResolvedValue({
      data: [
        {
          id: 2,
          paziente_id: 1,
          turno_id: null,
          autore_id: 9,
          timestamp: '2026-07-18T10:00:00Z',
          coscienza: '',
          emotivita: '',
          dolore: '',
          emodinamica: '',
          mobilizzazione: '',
          allert: 'Tranquillo',
        },
      ],
    })
    vi.mocked(consegneSbarApi.listConsegneSbarByPaziente).mockResolvedValue({
      data: [
        {
          id: 1,
          paziente_id: 1,
          turno_id: 4,
          autore_id: 9,
          creata_il: '2026-07-19T10:00:00Z',
          priorita: 'normale',
          situation: 's',
          background: 'b',
          assessment: 'a',
          recommendation: 'r',
        },
      ],
    })
    const chart = usePatientChart(1)

    await chart.load()

    expect(chart.timeline.value.map((entry) => entry.tipo)).toEqual([
      'sbar',
      'cedema',
    ])
  })
})

describe('usePatientChart — role gating', () => {
  it('canEditPatient is true only for caposala, canCreateClinicalEntries only for infermiere', () => {
    const auth = useAuthStore()

    auth.user = {
      id: 9,
      email: 'x@x.it',
      nome: 'X',
      cognome: 'Y',
      ruolo: 'caposala',
      reparto_id: 1,
    }
    const chartCaposala = usePatientChart(1)
    expect(chartCaposala.canEditPatient.value).toBe(true)
    expect(chartCaposala.canCreateClinicalEntries.value).toBe(false)

    auth.user = {
      id: 9,
      email: 'x@x.it',
      nome: 'X',
      cognome: 'Y',
      ruolo: 'infermiere',
      reparto_id: 1,
    }
    const chartInfermiere = usePatientChart(1)
    expect(chartInfermiere.canEditPatient.value).toBe(false)
    expect(chartInfermiere.canCreateClinicalEntries.value).toBe(true)
  })
})
