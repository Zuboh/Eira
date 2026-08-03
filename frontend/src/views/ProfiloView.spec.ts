import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as authApi from '@/api/auth'
import ProfiloView from '@/views/ProfiloView.vue'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/api/auth')

const infermiere = {
  id: 1,
  email: 'nurse@example.it',
  nome: 'Anna',
  cognome: 'Verdi',
  ruolo: 'infermiere' as const,
  reparto_id: 1,
  reparto_nome: 'Cardiologia',
  avatar_url: null,
}

function setSelectedFile(input: HTMLInputElement, file: File) {
  Object.defineProperty(input, 'files', { configurable: true, value: [file] })
}

beforeEach(() => {
  setActivePinia(createPinia())
  useAuthStore().user = infermiere
  Object.assign(URL, {
    createObjectURL: vi.fn(() => 'blob:avatar-preview'),
    revokeObjectURL: vi.fn(),
  })
})

describe('ProfiloView', () => {
  it('renders the read-only account fields from auth.user', () => {
    const wrapper = mount(ProfiloView)

    expect(wrapper.text()).toContain('Anna')
    expect(wrapper.text()).toContain('Verdi')
    expect(wrapper.text()).toContain('nurse@example.it')
    expect(wrapper.text()).toContain('Infermiere')
    expect(wrapper.text()).toContain('Cardiologia')
  })

  it('uploads the picked avatar and refreshes the session on save', async () => {
    vi.mocked(authApi.uploadMyAvatar).mockResolvedValue({
      data: { ...infermiere, avatar_url: '/static/avatars/new.jpg' },
    })
    vi.mocked(authApi.me).mockResolvedValue({
      data: { ...infermiere, avatar_url: '/static/avatars/new.jpg' },
    })
    const wrapper = mount(ProfiloView)
    const file = new File(['avatar'], 'foto.png', { type: 'image/png' })
    const input = wrapper.get<HTMLInputElement>('input[type="file"]')
    setSelectedFile(input.element, file)
    await input.trigger('change')

    const saveButton = wrapper
      .findAll('button')
      .find((btn) => btn.text().includes('Salva foto'))
    await saveButton?.trigger('click')
    await flushPromises()

    expect(authApi.uploadMyAvatar).toHaveBeenCalledWith(file)
    expect(authApi.me).toHaveBeenCalledOnce()
    expect(wrapper.text()).toContain('Foto profilo aggiornata.')
  })

  it('shows an error message when the upload fails', async () => {
    vi.mocked(authApi.uploadMyAvatar).mockRejectedValue(new Error('down'))
    const wrapper = mount(ProfiloView)
    const file = new File(['avatar'], 'foto.png', { type: 'image/png' })
    const input = wrapper.get<HTMLInputElement>('input[type="file"]')
    setSelectedFile(input.element, file)
    await input.trigger('change')

    const saveButton = wrapper
      .findAll('button')
      .find((btn) => btn.text().includes('Salva foto'))
    await saveButton?.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain(
      'Impossibile aggiornare la foto profilo. Riprova.',
    )
  })
})

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}
