import { onBeforeUnmount, ref, type Ref } from 'vue'

/**
 * Reattivo su una media query. Usato per i cambi di layout che non si
 * possono fare in CSS (vista FullCalendar, drawer di navigazione).
 */
export function useMediaQuery(query: string): Ref<boolean> {
  const matches = ref(false)

  if (typeof window === 'undefined' || !window.matchMedia) return matches

  const mql = window.matchMedia(query)
  matches.value = mql.matches

  const onChange = (event: MediaQueryListEvent) => {
    matches.value = event.matches
  }

  mql.addEventListener('change', onChange)
  onBeforeUnmount(() => mql.removeEventListener('change', onChange))

  return matches
}
