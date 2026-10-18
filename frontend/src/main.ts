import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import type { DatePickerPassThroughMethodOptions } from 'primevue/datepicker'
import ConfirmationService from 'primevue/confirmationservice'
import Tooltip from 'primevue/tooltip'
import { EiraPreset } from './theme'
import 'primeicons/primeicons.css'
import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)
const styles = getComputedStyle(document.documentElement)
const layer = (name: string) =>
  Number(styles.getPropertyValue(`--eira-z-${name}`))

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  // PrimeVue 4.5 emits selection/disclosure ARIA on elements without supporting roles.
  pt: {
    select: { overlay: { role: 'region', 'aria-label': 'Opzioni' } },
    datepicker: {
      day: ({ context }: DatePickerPassThroughMethodOptions) => ({
        role: 'button',
        'aria-selected': undefined,
        'aria-pressed': context.selected,
      }),
    },
    password: {
      pcInputText: {
        root: { 'aria-expanded': undefined, 'aria-haspopup': undefined },
      },
    },
  },
  zIndex: {
    modal: layer('modal'),
    overlay: layer('overlay'),
    menu: layer('overlay'),
    tooltip: layer('tooltip'),
  },
  theme: {
    preset: EiraPreset,
    options: { darkModeSelector: 'system' },
  },
})
app.use(ConfirmationService)
app.directive('tooltip', Tooltip)

router.isReady().then(() => app.mount('#app'))
