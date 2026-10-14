import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import Tooltip from 'primevue/tooltip'
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'
import '@fontsource-variable/manrope'
import 'primeicons/primeicons.css'
import './style.css'
import App from './App.vue'
import router from './router'

// Palette Eira ispirata ai temi teal di Atomize, adattata ai token PrimeVue.
const EiraPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#e7f5f2',
      100: '#ceebe6',
      200: '#9dd7ce',
      300: '#6bc2b6',
      400: '#39ad9f',
      500: '#00a499',
      600: '#00877d',
      700: '#00786f',
      800: '#00544e',
      900: '#003f3b',
      950: '#002c29',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#f8faf9',
          100: '#f0f4f3',
          200: '#dce8e3',
          300: '#bdcec6',
          400: '#94aaa0',
          500: '#6a7e77',
          600: '#526760',
          700: '#3b554d',
          800: '#283e36',
          900: '#172724',
          950: '#0f1b18',
        },
        primary: {
          color: '{primary.700}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.800}',
          activeColor: '{primary.900}',
        },
      },
      dark: {
        surface: {
          0: '#f1f7f4',
          50: '#e8f2ed',
          100: '#d6e5dd',
          200: '#b7cbc2',
          300: '#9db5aa',
          400: '#839c90',
          500: '#6b8579',
          600: '#526b60',
          700: '#3b5248',
          800: '#263530',
          900: '#1c2825',
          950: '#17221f',
        },
        primary: {
          color: '{primary.300}',
          contrastColor: '#07332f',
          hoverColor: '{primary.200}',
          activeColor: '{primary.100}',
        },
      },
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
app.use(ConfirmationService)
app.directive('tooltip', Tooltip)

router.isReady().then(() => app.mount('#app'))
