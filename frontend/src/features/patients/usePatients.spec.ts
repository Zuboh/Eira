import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePatients } from '@/features/patients/usePatients'
import { useAuthStore } from '@/stores/auth'
import * as pazientiApi from '@/api/pazienti'

vi.mock('@/api/pazienti')

const caposala = {
  id: 1,
  email: 'c@c.it',
  nome: 'Admin',
  cognome: 'Caposala',
  ruolo: 'caposala' as const,
  reparto_id: 1,
}
const infermiere = {
  id: 2,
  email: 'i@i.it',
  nome: 'Nurse',
  cognome: 'One',
  ruolo: 'infermiere' as const,
  reparto_id: 1,
}
const pazienti = [
  {
    id: 1,
    nome: 'Mario',
    cognome: 'Bianchi',
    eta: 70,
    letto: '3B',
    data_ricovero: '2026-07-01',
    diagnosi_ingresso: 'Frattura femore',
    reparto_id: 1,
    dimesso: false,
  },
]

beforeEach(() => {
  setActivePinia(createPinia())
  vi.mocked(pazientiApi.listPazienti).mockResolvedValue({ data: pazienti })
})

describe('usePatients — role gating', () => {
  it('canCreatePatient is true only for caposala, isNurse only for infermiere', () => {
    const auth = useAuthStore()

    auth.user = caposala
    const asCaposala = usePatients()
    expect(asCaposala.canCreatePatient.value).toBe(true)
    expect(asCaposala.isNurse.value).toBe(false)

    auth.user = infermiere
    const asInfermiere = usePatients()
    expect(asInfermiere.canCreatePatient.value).toBe(false)
    expect(asInfermiere.isNurse.value).toBe(true)
  })
})

describe('usePatients — load', () => {
  it('loads pazienti', async () => {
    const hook = usePatients()

    await hook.load()

    expect(hook.pazienti.value).toEqual(pazienti)
    expect(hook.loading.value).toBe(false)
  })

  it('sets an error message on load failure', async () => {
    vi.mocked(pazientiApi.listPazienti).mockRejectedValue(new Error('down'))
    const hook = usePatients()

    await hook.load()

    expect(hook.error.value).toBe('Impossibile caricare i pazienti.')
  })
})

describe('usePatients — apriNuovo', () => {
  it('resets the form and opens the dialog', () => {
    const hook = usePatients()
    hook.form.value.nome = 'stale'
    hook.dialogOpen.value = false

    hook.apriNuovo()

    expect(hook.form.value.nome).toBe('')
    expect(hook.dialogOpen.value).toBe(true)
  })
})

describe('usePatients — salva', () => {
  it('creates the patient with the reparto_id, closes the dialog, and reloads', async () => {
    useAuthStore().user = caposala
    vi.mocked(pazientiApi.createPaziente).mockResolvedValue({
      data: pazienti[0],
    })
    const hook = usePatients()
    hook.dialogOpen.value = true
    hook.form.value = {
      nome: 'Nuovo',
      cognome: 'Paziente',
      eta: 50,
      letto: '1A',
      data_ricovero: new Date('2026-07-19'),
      diagnosi_ingresso: 'Osservazione',
    }

    await hook.salva()

    expect(pazientiApi.createPaziente).toHaveBeenCalledWith(
      expect.objectContaining({ nome: 'Nuovo', reparto_id: 1 }),
    )
    expect(hook.dialogOpen.value).toBe(false)
    expect(pazientiApi.listPazienti).toHaveBeenCalledOnce()
  })

  it('is a no-op without an authenticated user', async () => {
    const hook = usePatients()

    await hook.salva()

    expect(pazientiApi.createPaziente).not.toHaveBeenCalled()
  })

  it('is a no-op when eta is missing from the form', async () => {
    useAuthStore().user = caposala
    const hook = usePatients()
    hook.form.value.eta = null

    await hook.salva()

    expect(pazientiApi.createPaziente).not.toHaveBeenCalled()
  })

  it('sets an error on failure', async () => {
    useAuthStore().user = caposala
    vi.mocked(pazientiApi.createPaziente).mockRejectedValue(new Error('down'))
    const hook = usePatients()
    hook.form.value.eta = 50

    await hook.salva()

    expect(hook.error.value).toBe('Impossibile creare il paziente.')
    expect(hook.saving.value).toBe(false)
  })
})
