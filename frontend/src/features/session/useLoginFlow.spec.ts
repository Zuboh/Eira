import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useLoginFlow } from '@/features/session/useLoginFlow'
import * as authApi from '@/api/auth'
import * as repartiApi from '@/api/reparti'

vi.mock('@/api/auth')
vi.mock('@/api/reparti')

const reparto = { id: 1, nome: 'Cardiologia' }
const utente = {
  id: 10,
  nome: 'Anna',
  cognome: 'Rossi',
  ruolo: 'infermiere' as const,
}

function mountLoginFlow() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: { template: '<div />' } },
      {
        path: '/infermiere',
        name: 'infermiere-dashboard',
        component: { template: '<div />' },
      },
    ],
  })

  let result!: ReturnType<typeof useLoginFlow>
  const host = defineComponent({
    setup() {
      result = useLoginFlow({ focusFirstOf: vi.fn() })
      return () => h('div')
    },
  })

  const wrapper = mount(host, { global: { plugins: [router] } })
  return {
    wrapper,
    router,
    get flow() {
      return result
    },
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  vi.mocked(repartiApi.listReparti).mockResolvedValue({ data: [reparto] })
  vi.mocked(repartiApi.listUtentiByReparto).mockResolvedValue({
    data: [utente],
  })
})

describe('useLoginFlow — bootstrap on mount', () => {
  it('loads reparti and stays on the reparto step when no device reparto is saved', async () => {
    const { flow } = mountLoginFlow()
    await flushMounted()

    expect(repartiApi.listReparti).toHaveBeenCalledOnce()
    expect(flow.step.value).toBe('reparto')
    expect(flow.reparti.value).toEqual([reparto])
  })

  it('loads utenti tiles and jumps to the tiles step when a device reparto is already saved', async () => {
    localStorage.setItem('eira_device_reparto', '1')

    const { flow } = mountLoginFlow()
    await flushMounted()

    expect(repartiApi.listUtentiByReparto).toHaveBeenCalledWith(1)
    expect(flow.step.value).toBe('tiles')
    expect(flow.utenti.value).toEqual([utente])
  })
})

describe('useLoginFlow — navigation', () => {
  it('chooseReparto saves the device reparto and moves to the tiles step', async () => {
    const { flow } = mountLoginFlow()
    await flushMounted()

    await flow.chooseReparto(reparto)

    expect(localStorage.getItem('eira_device_reparto')).toBe('1')
    expect(flow.step.value).toBe('tiles')
  })

  it('selectUtente moves to the password step', async () => {
    const { flow } = mountLoginFlow()
    await flushMounted()

    await flow.selectUtente(utente)

    expect(flow.step.value).toBe('password')
    expect(flow.selectedUtente.value).toEqual(utente)
  })

  it('cambiaReparto clears device reparto and returns to the reparto step', async () => {
    localStorage.setItem('eira_device_reparto', '1')
    const { flow } = mountLoginFlow()
    await flushMounted()
    await flow.selectUtente(utente)

    flow.cambiaReparto()
    await flushMounted()

    expect(localStorage.getItem('eira_device_reparto')).toBeNull()
    expect(flow.step.value).toBe('reparto')
    expect(flow.selectedUtente.value).toBeNull()
  })
})

describe('useLoginFlow — onSubmit', () => {
  it('logs in and redirects to the role dashboard on success', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      data: { access_token: 'tok', token_type: 'bearer' },
    })
    vi.mocked(authApi.me).mockResolvedValue({
      data: {
        id: 10,
        email: 'a@a.it',
        nome: 'Anna',
        cognome: 'Rossi',
        ruolo: 'infermiere',
        reparto_id: 1,
      },
    })

    const { flow, router } = mountLoginFlow()
    await flushMounted()
    await flow.selectUtente(utente)
    flow.password.value = 'password123'
    const pushSpy = vi.spyOn(router, 'push')

    await flow.onSubmit()

    expect(pushSpy).toHaveBeenCalledWith({ name: 'infermiere-dashboard' })
    expect(flow.error.value).toBe('')
  })

  it('moves to change-password step when the API demands a password change', async () => {
    vi.mocked(authApi.login).mockRejectedValue({
      response: { status: 403, data: { detail: 'password_change_required' } },
    })

    const { flow } = mountLoginFlow()
    await flushMounted()
    await flow.selectUtente(utente)
    flow.password.value = 'temp-pass'

    await flow.onSubmit()

    expect(flow.step.value).toBe('change-password')
    expect(flow.temporaryPassword.value).toBe('temp-pass')
    expect(flow.password.value).toBe('')
  })

  it('shows the expired-password message and clears the password on a 403 expired response', async () => {
    vi.mocked(authApi.login).mockRejectedValue({
      response: { status: 403, data: { detail: 'temporary_password_expired' } },
    })

    const { flow } = mountLoginFlow()
    await flushMounted()
    await flow.selectUtente(utente)
    flow.password.value = 'temp-pass'

    await flow.onSubmit()

    expect(flow.error.value).toMatch(/Password temporanea scaduta/)
    expect(flow.password.value).toBe('')
  })

  it('shows a generic credentials error on any other failure', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new Error('network down'))

    const { flow } = mountLoginFlow()
    await flushMounted()
    await flow.selectUtente(utente)
    flow.password.value = 'wrong'

    await flow.onSubmit()

    expect(flow.error.value).toBe('Credenziali non valide.')
  })
})

describe('useLoginFlow — onChangeTemporaryPassword', () => {
  it('rejects mismatched passwords without calling the API', async () => {
    const { flow } = mountLoginFlow()
    await flushMounted()
    await flow.selectUtente(utente)
    flow.newPassword.value = 'abc123'
    flow.confirmPassword.value = 'different'

    await flow.onChangeTemporaryPassword()

    expect(flow.error.value).toBe('Le password non coincidono.')
    expect(authApi.changeTemporaryPassword).not.toHaveBeenCalled()
  })

  it('updates the password and returns to the password step on success', async () => {
    vi.mocked(authApi.changeTemporaryPassword).mockResolvedValue({
      data: {
        id: 10,
        email: 'a@a.it',
        nome: 'Anna',
        cognome: 'Rossi',
        ruolo: 'infermiere',
        reparto_id: 1,
      },
    })

    const { flow } = mountLoginFlow()
    await flushMounted()
    await flow.selectUtente(utente)
    flow.newPassword.value = 'newpass123'
    flow.confirmPassword.value = 'newpass123'

    await flow.onChangeTemporaryPassword()

    expect(flow.step.value).toBe('password')
    expect(flow.success.value).toMatch(/Password aggiornata/)
  })
})

async function flushMounted() {
  await nextTick()
  await nextTick()
}
