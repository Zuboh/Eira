import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'
import 'primeicons/primeicons.css'
import './style.css'
import App from './App.vue'
import router from './router'

// docs/DESIGN.md sez. 2/5 — accent Electric Blue, radius contenuto, focus ring offset 2px
const EiraPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
    focusRing: {
      // width 0 kills PrimeVue's own hardcoded outline on Button (and
      // anything else keyed off {focus.ring.*}) — the visible ring is the
      // box-shadow set per severity below instead. Soft glow, not a hard border.
      width: '0',
      style: 'none',
      color: '{primary.color}',
      offset: '2px',
    },
    // form controls (input, select...) key off a SEPARATE {form.field.focus.ring.*}
    // namespace, not {focus.ring.*} above — same fix, different token path
    formField: {
      focusRing: {
        width: '0',
        style: 'none',
      },
    },
  },
  components: {
    button: {
      root: { borderRadius: '0.5rem' },
      // secondary severity (incl. Dialog's default close button) otherwise
      // gets Aura's stock {surface.600}/{surface.300} gray focus ring —
      // keep buttons clean/no ring everywhere, not stock-gray on secondary
      colorScheme: {
        light: {
          root: { secondary: { focusRing: { color: '{primary.color}' } } },
        },
        dark: {
          root: { secondary: { focusRing: { color: '{primary.color}' } } },
        },
      },
    },
    inputtext: {
      root: { borderRadius: '0.5rem' },
    },
  },
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: EiraPreset,
  },
})

router.isReady().then(() => app.mount('#app'))
