import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useStaffWorkflow } from '@/features/staff/useStaffWorkflow'
import { useAuthStore } from '@/stores/auth'
import * as utentiApi from '@/api/utenti'

vi.mock('@/api/utenti')

const caposala = {
  id: 1,
  email: 'c@c.it',
  nome: 'Admin',
  cognome: 'Caposala',
  ruolo: 'caposala' as const,
  reparto_id: 1,
}
const utenti = [
  {
    id: 1,
    nome: 'A',
    cognome: 'Uno',
    email: 'a@a.it',
    ruolo: 'infermiere' as const,
    reparto_id: 1,
    stato: 'in_attesa' as const,
  },
  {
    id: 2,
    nome: 'B',
    cognome: 'Due',
    email: 'b@a.it',
    ruolo: 'infermiere' as const,
    reparto_id: 1,
    stato: 'attivo' as const,
  },
]

beforeEach(() => {
  setActivePinia(createPinia())
  vi.mocked(utentiApi.listUtenti).mockResolvedValue({ data: utenti })
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  })
})

describe('useStaffWorkflow — load and filtrati', () => {
  it('loads utenti and filters by the current filtro', async () => {
    const hook = useStaffWorkflow()

    await hook.load()

    expect(hook.filtrati.value.map((u) => u.id)).toEqual([1])
    hook.filtro.value = 'attivo'
    expect(hook.filtrati.value.map((u) => u.id)).toEqual([2])
  })

  it('sets an error message on load failure', async () => {
    vi.mocked(utentiApi.listUtenti).mockRejectedValue(new Error('down'))
    const hook = useStaffWorkflow()

    await hook.load()

    expect(hook.error.value).toBe('Impossibile caricare il personale.')
  })
})

describe('useStaffWorkflow — salvaNuovo', () => {
  it('creates the user with the caposala reparto_id, switches filtro to attivo, and reloads', async () => {
    useAuthStore().user = caposala
    vi.mocked(utentiApi.createUtente).mockResolvedValue({ data: utenti[1] })
    const hook = useStaffWorkflow()
    hook.newForm.value = {
      nome: 'Nuovo',
      cognome: 'Utente',
      email: 'nuovo@a.it',
      password: 'password',
      ruolo: 'infermiere',
    }

    await hook.salvaNuovo()

    expect(utentiApi.createUtente).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'nuovo@a.it', reparto_id: 1 }),
    )
    expect(hook.newDialogOpen.value).toBe(false)
    expect(hook.filtro.value).toBe('attivo')
    expect(utentiApi.listUtenti).toHaveBeenCalledOnce()
  })

  it('is a no-op without an authenticated user', async () => {
    const hook = useStaffWorkflow()

    await hook.salvaNuovo()

    expect(utentiApi.createUtente).not.toHaveBeenCalled()
  })

  it('sets an error on failure', async () => {
    useAuthStore().user = caposala
    vi.mocked(utentiApi.createUtente).mockRejectedValue(new Error('down'))
    const hook = useStaffWorkflow()

    await hook.salvaNuovo()

    expect(hook.error.value).toBe("Impossibile creare l'utente.")
  })
})

describe('useStaffWorkflow — approva', () => {
  it('activates the user and mutates it in place', async () => {
    vi.mocked(utentiApi.updateUtente).mockResolvedValue({ data: utenti[0] })
    const hook = useStaffWorkflow()
    const target = { ...utenti[0] }

    await hook.approva(target)

    expect(utentiApi.updateUtente).toHaveBeenCalledWith(1, { stato: 'attivo' })
    expect(target.stato).toBe('attivo')
  })

  it('sets an error on failure', async () => {
    vi.mocked(utentiApi.updateUtente).mockRejectedValue(new Error('down'))
    const hook = useStaffWorkflow()

    await hook.approva({ ...utenti[0] })

    expect(hook.error.value).toBe("Impossibile approvare l'utente.")
  })
})

describe('useStaffWorkflow — reimpostaPassword / copiaPassword', () => {
  it('stores the generated temporary password', async () => {
    vi.mocked(utentiApi.createTemporaryPassword).mockResolvedValue({
      data: { temporary_password: 'temp-123' },
    })
    const hook = useStaffWorkflow()

    await hook.reimpostaPassword(utenti[0])

    expect(hook.temporaryPassword.value).toBe('temp-123')
    expect(hook.resetLoadingId.value).toBeNull()
  })

  it('sets an error on failure', async () => {
    vi.mocked(utentiApi.createTemporaryPassword).mockRejectedValue(
      new Error('down'),
    )
    const hook = useStaffWorkflow()

    await hook.reimpostaPassword(utenti[0])

    expect(hook.error.value).toBe(
      'Impossibile generare la password temporanea.',
    )
  })

  it('copiaPassword writes the current temporary password to the clipboard', async () => {
    vi.mocked(utentiApi.createTemporaryPassword).mockResolvedValue({
      data: { temporary_password: 'temp-123' },
    })
    const hook = useStaffWorkflow()
    await hook.reimpostaPassword(utenti[0])

    await hook.copiaPassword()

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('temp-123')
  })

  it('copiaPassword is a no-op without a temporary password set', async () => {
    const hook = useStaffWorkflow()

    await hook.copiaPassword()

    expect(navigator.clipboard.writeText).not.toHaveBeenCalled()
  })
})
