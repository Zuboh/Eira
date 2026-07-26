import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { useMediaQuery } from '@/composables/useMediaQuery'

type ChangeHandler = (event: MediaQueryListEvent) => void

function stubMatchMedia(initialMatches: boolean) {
  const handlers = new Set<ChangeHandler>()
  const removeEventListener = vi.fn((_: string, handler: ChangeHandler) => {
    handlers.delete(handler)
  })

  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: initialMatches,
      addEventListener: (_: string, handler: ChangeHandler) => {
        handlers.add(handler)
      },
      removeEventListener,
    })),
  )

  return {
    removeEventListener,
    emit(matches: boolean) {
      handlers.forEach((handler) => handler({ matches } as MediaQueryListEvent))
    },
  }
}

function mountWithQuery(query = '(max-width: 599px)') {
  const Host = defineComponent({
    setup() {
      const matches = useMediaQuery(query)
      return () => h('span', matches.value ? 'yes' : 'no')
    },
  })

  return mount(Host)
}

describe('useMediaQuery', () => {
  it('starts from the current match state', () => {
    stubMatchMedia(true)

    expect(mountWithQuery().text()).toBe('yes')
  })

  it('updates when the media query changes', async () => {
    const mql = stubMatchMedia(false)
    const wrapper = mountWithQuery()

    expect(wrapper.text()).toBe('no')

    mql.emit(true)
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toBe('yes')
  })

  it('removes the listener on unmount', () => {
    const mql = stubMatchMedia(false)

    mountWithQuery().unmount()

    expect(mql.removeEventListener).toHaveBeenCalled()
  })

  it('returns false when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined)

    expect(mountWithQuery().text()).toBe('no')
  })
})
