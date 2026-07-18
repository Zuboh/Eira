import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCambiTurno } from '@/features/cambi-turno/useCambiTurno'
import { useAuthStore } from '@/stores/auth'
import * as cambiTurnoApi from '@/api/cambiTurno'
import * as turniApi from '@/api/turni'
import * as utentiApi from '@/api/utenti'
import type { RichiestaCambioTurno } from '@/api/cambiTurno'

vi.mock('@/api/cambiTurno')
vi.mock('@/api/turni')
vi.mock('@/api/utenti')

const infermiere = {
  id: 1,
  email: 'x@x.it',
  nome: 'Anna',
  cognome: 'Rossi',
  ruolo: 'infermiere' as const,
  reparto_id: 1,
}
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
    ruolo: 'infermiere' as const,
    reparto_id: 1,
    stato: 'attivo' as const,
  },
  {
    id: 3,
    nome: 'Carla',
    cognome: 'Neri',
    email: 'c@a.it',
    ruolo: 'caposala' as const,
    reparto_id: 1,
    stato: 'attivo' as const,
  },
]

function richiesta(
  overrides: Partial<RichiestaCambioTurno> = {},
): RichiestaCambioTurno {
  return {
    id: 1,
    assegnazione_turno_id: 10,
    richiedente_id: 1,
    collega_id: 2,
    stato: 'in_attesa_collega',
    creata_il: '2026-07-18T10:00:00Z',
    risposta_collega_il: null,
    risposta_caposala_id: null,
    risposta_caposala_il: null,
    motivo_rifiuto: null,
    ...overrides,
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.mocked(cambiTurnoApi.listCambiTurno).mockResolvedValue({ data: [] })
  vi.mocked(utentiApi.listUtenti).mockResolvedValue({ data: utenti })
  vi.mocked(turniApi.getMieAssegnazioni).mockResolvedValue({ data: [] })
})

describe('useCambiTurno — load', () => {
  it('loads richieste/utenti, and also assegnazioni for an infermiere', async () => {
    useAuthStore().user = infermiere
    const hook = useCambiTurno()

    await hook.load()

    expect(turniApi.getMieAssegnazioni).toHaveBeenCalledOnce()
    expect(hook.utenti.value).toEqual(utenti)
  })

  it('does not load assegnazioni for a caposala', async () => {
    useAuthStore().user = { ...infermiere, id: 3, ruolo: 'caposala' }
    const hook = useCambiTurno()

    await hook.load()

    expect(turniApi.getMieAssegnazioni).not.toHaveBeenCalled()
  })

  it('sets an error message when loading fails', async () => {
    vi.mocked(cambiTurnoApi.listCambiTurno).mockRejectedValue(new Error('down'))
    const hook = useCambiTurno()

    await hook.load()

    expect(hook.error.value).toBe(
      'Impossibile caricare le richieste di cambio turno.',
    )
  })
})

describe('useCambiTurno — colleghi/gates', () => {
  it('colleghi excludes the current user and caposala accounts', async () => {
    useAuthStore().user = infermiere
    const hook = useCambiTurno()
    hook.setUtenti(utenti)

    expect(hook.colleghi.value.map((u) => u.id)).toEqual([2])
  })

  it('canRequestChange is true only for infermiere', () => {
    useAuthStore().user = { ...infermiere, ruolo: 'caposala' }
    expect(useCambiTurno().canRequestChange.value).toBe(false)

    useAuthStore().user = infermiere
    expect(useCambiTurno().canRequestChange.value).toBe(true)
  })
})

describe('useCambiTurno — salva', () => {
  it('is a no-op when the form is incomplete', async () => {
    const hook = useCambiTurno()
    hook.form.value = { assegnazione_turno_id: null, collega_id: null }

    await hook.salva()

    expect(cambiTurnoApi.createRichiestaCambioTurno).not.toHaveBeenCalled()
  })

  it('creates the request, closes the dialog, and refreshes on success', async () => {
    vi.mocked(cambiTurnoApi.createRichiestaCambioTurno).mockResolvedValue({
      data: richiesta(),
    })
    const hook = useCambiTurno()
    hook.dialogOpen.value = true
    hook.form.value = { assegnazione_turno_id: 10, collega_id: 2 }

    await hook.salva()

    expect(cambiTurnoApi.createRichiestaCambioTurno).toHaveBeenCalledWith({
      assegnazione_turno_id: 10,
      collega_id: 2,
    })
    expect(hook.dialogOpen.value).toBe(false)
    expect(cambiTurnoApi.listCambiTurno).toHaveBeenCalledOnce()
  })

  it('uses the custom refreshAfterMutation instead of load when provided', async () => {
    vi.mocked(cambiTurnoApi.createRichiestaCambioTurno).mockResolvedValue({
      data: richiesta(),
    })
    const refreshAfterMutation = vi.fn()
    const hook = useCambiTurno({ refreshAfterMutation })
    hook.form.value = { assegnazione_turno_id: 10, collega_id: 2 }

    await hook.salva()

    expect(refreshAfterMutation).toHaveBeenCalledOnce()
    expect(cambiTurnoApi.listCambiTurno).not.toHaveBeenCalled()
  })

  it('sets an error on failure', async () => {
    vi.mocked(cambiTurnoApi.createRichiestaCambioTurno).mockRejectedValue(
      new Error('down'),
    )
    const hook = useCambiTurno()
    hook.form.value = { assegnazione_turno_id: 10, collega_id: 2 }

    await hook.salva()

    expect(hook.error.value).toBe('Impossibile creare la richiesta.')
  })
})

describe('useCambiTurno — collega/caposala responses', () => {
  it('rispondiComeCollega accepts and refreshes', async () => {
    vi.mocked(cambiTurnoApi.rispondiCollega).mockResolvedValue({
      data: richiesta(),
    })
    const hook = useCambiTurno()

    await hook.rispondiComeCollega(richiesta(), true)

    expect(cambiTurnoApi.rispondiCollega).toHaveBeenCalledWith(1, {
      accetta: true,
    })
    expect(cambiTurnoApi.listCambiTurno).toHaveBeenCalledOnce()
  })

  it('approvaCaposala approves and refreshes', async () => {
    vi.mocked(cambiTurnoApi.rispondiCaposala).mockResolvedValue({
      data: richiesta(),
    })
    const hook = useCambiTurno()

    await hook.approvaCaposala(richiesta())

    expect(cambiTurnoApi.rispondiCaposala).toHaveBeenCalledWith(1, {
      accetta: true,
    })
  })

  it('confermaRifiuto sends the motivo and closes the dialog', async () => {
    vi.mocked(cambiTurnoApi.rispondiCaposala).mockResolvedValue({
      data: richiesta(),
    })
    const hook = useCambiTurno()
    hook.apriRifiuto(richiesta())
    hook.motivoRifiuto.value = 'Turno già coperto'

    await hook.confermaRifiuto()

    expect(cambiTurnoApi.rispondiCaposala).toHaveBeenCalledWith(1, {
      accetta: false,
      motivo_rifiuto: 'Turno già coperto',
    })
    expect(hook.rifiutoDialog.value).toBe(false)
  })

  it('cancella deletes the request and refreshes', async () => {
    vi.mocked(cambiTurnoApi.deleteCambioTurno).mockResolvedValue(undefined)
    const hook = useCambiTurno()

    await hook.cancella(richiesta())

    expect(cambiTurnoApi.deleteCambioTurno).toHaveBeenCalledWith(1)
    expect(cambiTurnoApi.listCambiTurno).toHaveBeenCalledOnce()
  })
})
