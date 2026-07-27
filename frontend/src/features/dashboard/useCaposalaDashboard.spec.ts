import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCaposalaDashboard } from '@/features/dashboard/useCaposalaDashboard'
import * as dashboardApi from '@/api/dashboard'
import * as turniApi from '@/api/turni'
import * as utentiApi from '@/api/utenti'

vi.mock('@/api/dashboard')
vi.mock('@/api/turni')
vi.mock('@/api/utenti')

const utenti = [
  {
    id: 1,
    nome: 'Anna',
    cognome: 'Rossi',
    email: 'a@a.it',
    ruolo: 'infermiere' as const,
    reparto_id: 1,
    stato: 'attivo' as const,
  },
  {
    id: 2,
    nome: 'Bruno',
    cognome: 'Verdi',
    email: 'b@a.it',
    ruolo: 'caposala' as const,
    reparto_id: 1,
    stato: 'attivo' as const,
  },
  {
    id: 3,
    nome: 'Carla',
    cognome: 'Neri',
    email: 'c@a.it',
    ruolo: 'infermiere' as const,
    reparto_id: 1,
    stato: 'in_attesa' as const,
  },
]

const dashboard = {
  turni_scoperti: [],
  turni_scoperti_count: 0,
  cambi_turno_in_attesa: [],
  cambi_turno_in_attesa_count: 0,
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.mocked(utentiApi.listUtenti).mockResolvedValue({ data: utenti })
  vi.mocked(dashboardApi.getDashboardCaposala).mockResolvedValue({
    data: dashboard,
  })
  vi.mocked(turniApi.getCalendarioTurni).mockResolvedValue({ data: [] })
})

describe('useCaposalaDashboard — load', () => {
  it('aggregates utenti/dashboard/calendario and derives pendingCount + infermieri', async () => {
    const dash = useCaposalaDashboard()

    await dash.load()

    expect(dash.pendingCount.value).toBe(1)
    expect(dash.infermieri.value.map((u) => u.id)).toEqual([1, 3])
    expect(dash.dashboard.value).toEqual(dashboard)
    expect(dashboardApi.getDashboardCaposala).toHaveBeenCalledWith({
      giorni: 7,
      limit: 50,
    })
    expect(dashboardApi.getDashboardCaposala).toHaveBeenCalledWith({
      giorni: 14,
      limit: 50,
    })
    expect(dashboardApi.getDashboardCaposala).toHaveBeenCalledWith({
      giorni: 30,
      limit: 90,
    })
    expect(dashboardApi.getDashboardCaposala).toHaveBeenCalledTimes(3)
    expect(turniApi.getCalendarioTurni).toHaveBeenCalledWith({
      da: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      a: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    })
    const calendarioParams = vi.mocked(turniApi.getCalendarioTurni).mock
      .calls[0][0]
    expect(calendarioParams).toBeDefined()
    if (!calendarioParams) throw new Error('Parametri calendario mancanti')
    const calendarioCacheDa = new Date(`${calendarioParams.da}T00:00:00`)
    const calendarioCacheA = new Date(`${calendarioParams.a}T00:00:00`)
    expect(
      Math.round(
        (calendarioCacheA.getTime() - calendarioCacheDa.getTime()) /
          (24 * 60 * 60 * 1000),
      ),
    ).toBe(34)
    expect(dash.error.value).toBe('')
    expect(dash.loading.value).toBe(false)
  })

  it('sets an error message when any request fails', async () => {
    vi.mocked(dashboardApi.getDashboardCaposala).mockRejectedValue(
      new Error('down'),
    )
    const dash = useCaposalaDashboard()

    await dash.load()

    expect(dash.error.value).toBe('Impossibile caricare la dashboard.')
    expect(dash.loading.value).toBe(false)
  })

  it('changes the uncovered-shift range locally without another API request', async () => {
    const dash = useCaposalaDashboard()

    await dash.load()
    const requestsAfterLoad = vi.mocked(dashboardApi.getDashboardCaposala).mock
      .calls.length
    dash.setTurniScopertiGiorni(14)

    expect(dash.turniScopertiGiorni.value).toBe(14)
    expect(dashboardApi.getDashboardCaposala).toHaveBeenCalledTimes(
      requestsAfterLoad,
    )
    expect(dash.loading.value).toBe(false)
  })

  it('moves the calendar window locally without another API request', async () => {
    const dash = useCaposalaDashboard()

    await dash.load()
    const initialDate = dash.calendarioDa.value
    dash.spostaSettimanaCalendario(1)

    const expected = new Date(`${initialDate}T00:00:00`)
    expected.setDate(expected.getDate() + 7)
    expect(dash.calendarioDa.value).toBe(
      [
        expected.getFullYear(),
        `${expected.getMonth() + 1}`.padStart(2, '0'),
        `${expected.getDate()}`.padStart(2, '0'),
      ].join('-'),
    )
    expect(turniApi.getCalendarioTurni).toHaveBeenCalledOnce()
    expect(dash.loading.value).toBe(false)
  })
})

describe('useCaposalaDashboard — assegna turno', () => {
  const turno = {
    id: 5,
    data: '2026-07-20',
    tipo: 'mattina' as const,
    reparto_id: 1,
    ora_inizio: '07:00:00',
    ora_fine: '14:00:00',
  }

  it('opens the dialog targeting the given turno', () => {
    const dash = useCaposalaDashboard()

    dash.apriAssegna(turno)

    expect(dash.assegnaDialog.value).toBe(true)
    expect(dash.assegnaTarget.value).toEqual(turno)
    expect(dash.assegnaInfermiereId.value).toBeNull()
  })

  it('confermaAssegna calls the API, closes the dialog, and reloads on success', async () => {
    vi.mocked(turniApi.assegnaTurno).mockResolvedValue({
      data: { id: 99, turno_id: turno.id, infermiere_id: 1, stato: 'attiva' },
    })
    const dash = useCaposalaDashboard()
    dash.apriAssegna(turno)
    dash.assegnaInfermiereId.value = 1

    await dash.confermaAssegna()

    expect(turniApi.assegnaTurno).toHaveBeenCalledWith(5, 1)
    expect(dash.assegnaDialog.value).toBe(false)
    expect(dash.saving.value).toBe(false)
    expect(utentiApi.listUtenti).toHaveBeenCalledOnce()
  })

  it('confermaAssegna sets an error and keeps the dialog open on failure', async () => {
    vi.mocked(turniApi.assegnaTurno).mockRejectedValue(new Error('conflict'))
    const dash = useCaposalaDashboard()
    dash.apriAssegna(turno)
    dash.assegnaInfermiereId.value = 1

    await dash.confermaAssegna()

    expect(dash.error.value).toBe('Impossibile assegnare il turno.')
    expect(dash.assegnaDialog.value).toBe(true)
    expect(dash.saving.value).toBe(false)
  })

  it('confermaAssegna is a no-op without a target or a selected infermiere', async () => {
    const dash = useCaposalaDashboard()

    await dash.confermaAssegna()

    expect(turniApi.assegnaTurno).not.toHaveBeenCalled()
  })
})
