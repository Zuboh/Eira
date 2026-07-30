import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AvatarFilePicker from '@/features/staff/components/AvatarFilePicker.vue'

const createObjectURL = vi.fn(() => 'blob:avatar-preview')
const revokeObjectURL = vi.fn()

function setSelectedFile(input: HTMLInputElement, file: File) {
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: [file],
  })
}

beforeEach(() => {
  createObjectURL.mockClear()
  revokeObjectURL.mockClear()
  Object.assign(URL, { createObjectURL, revokeObjectURL })
})

describe('AvatarFilePicker', () => {
  it('selects and previews a supported image', async () => {
    const wrapper = mount(AvatarFilePicker, {
      props: { modelValue: null },
    })
    const input = wrapper.get<HTMLInputElement>('input[type="file"]')
    const file = new File(['avatar'], 'profilo.png', { type: 'image/png' })

    setSelectedFile(input.element, file)
    await input.trigger('change')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([file])

    await wrapper.setProps({ modelValue: file })
    expect(wrapper.get('img').attributes('src')).toBe('blob:avatar-preview')
    expect(wrapper.text()).toContain('profilo.png')
    expect(wrapper.text()).toContain('Cambia foto')
  })

  it.each([
    {
      file: new File(['testo'], 'note.txt', { type: 'text/plain' }),
      message: 'Formato non supportato. Usa JPG, PNG o WebP.',
    },
    {
      file: new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'grande.png', {
        type: 'image/png',
      }),
      message: 'La foto supera il limite massimo di 2 MB.',
    },
  ])('rejects an invalid selection: $message', async ({ file, message }) => {
    const wrapper = mount(AvatarFilePicker, {
      props: { modelValue: null },
    })
    const input = wrapper.get<HTMLInputElement>('input[type="file"]')

    setSelectedFile(input.element, file)
    await input.trigger('change')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.get('[role="alert"]').text()).toBe(message)
  })

  it('removes the current image and releases its preview URL', async () => {
    const file = new File(['avatar'], 'profilo.webp', { type: 'image/webp' })
    const wrapper = mount(AvatarFilePicker, {
      props: { modelValue: file },
    })

    await wrapper.get('[data-testid="avatar-remove"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([null])
    await wrapper.setProps({ modelValue: null })
    expect(wrapper.find('img').exists()).toBe(false)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:avatar-preview')
  })

  it('allows selecting the same file again after removing it', async () => {
    const file = new File(['avatar'], 'profilo.webp', { type: 'image/webp' })
    const wrapper = mount(AvatarFilePicker, {
      props: { modelValue: file },
    })
    const input = wrapper.get<HTMLInputElement>('input[type="file"]')

    await wrapper.get('[data-testid="avatar-remove"]').trigger('click')
    await wrapper.setProps({ modelValue: null })
    setSelectedFile(input.element, file)
    await input.trigger('change')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([file])
  })
})
