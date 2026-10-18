import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

// CSS owns product values; this adapter maps them to PrimeVue's supported tokens.
const token = (name: string) => `var(--eira-${name})`
const focusRing = {
  width: '2px',
  style: 'solid',
  color: token('focus-ring'),
  offset: '2px',
  shadow: 'none',
}
const surface = {
  0: token('color-white'),
  50: token('color-neutral-50'),
  100: token('color-neutral-100'),
  200: token('color-neutral-200'),
  300: token('color-neutral-300'),
  400: token('color-neutral-400'),
  500: token('color-neutral-500'),
  600: token('color-neutral-500'),
  700: token('color-neutral-700'),
  800: token('color-neutral-800'),
  900: token('color-neutral-850'),
  950: token('color-neutral-900'),
}
const overlay = {
  background: token('bg-surface'),
  borderColor: token('border-default'),
  color: token('text-primary'),
}
const scheme = {
  surface,
  primary: {
    color: token('action-primary'),
    contrastColor: token('action-on-primary'),
    hoverColor: token('action-primary-hover'),
    activeColor: token('action-primary-hover'),
  },
  highlight: {
    background: token('action-selected-background'),
    focusBackground: token('action-selected-background'),
    color: token('action-selected-text'),
    focusColor: token('action-selected-text'),
  },
  text: {
    color: token('text-primary'),
    hoverColor: token('text-primary'),
    mutedColor: token('text-secondary'),
    hoverMutedColor: token('text-primary'),
  },
  content: {
    ...overlay,
    hoverBackground: token('bg-hover'),
    hoverColor: token('text-primary'),
  },
  formField: {
    background: token('bg-surface'),
    disabledBackground: token('bg-subtle'),
    filledBackground: token('bg-subtle'),
    filledHoverBackground: token('bg-hover'),
    filledFocusBackground: token('bg-surface'),
    borderColor: token('border-control'),
    hoverBorderColor: token('text-secondary'),
    focusBorderColor: token('border-control'),
    invalidBorderColor: token('status-danger'),
    color: token('text-primary'),
    disabledColor: token('text-disabled'),
    placeholderColor: token('text-secondary'),
    invalidPlaceholderColor: token('status-danger'),
    iconColor: token('text-secondary'),
    shadow: 'none',
  },
  overlay: { select: overlay, popover: overlay, modal: overlay },
  list: {
    option: {
      focusBackground: token('bg-hover'),
      selectedBackground: token('action-selected-background'),
      selectedFocusBackground: token('action-selected-background'),
      color: token('text-primary'),
      focusColor: token('text-primary'),
      selectedColor: token('action-selected-text'),
      selectedFocusColor: token('action-selected-text'),
    },
  },
  navigation: {
    item: {
      focusBackground: token('bg-hover'),
      activeBackground: token('action-selected-background'),
      color: token('text-primary'),
      focusColor: token('text-primary'),
      activeColor: token('action-selected-text'),
    },
  },
}
const secondary = {
  background: token('bg-surface'),
  hoverBackground: token('bg-hover'),
  activeBackground: token('bg-subtle'),
  borderColor: token('border-control'),
  hoverBorderColor: token('text-secondary'),
  activeBorderColor: token('text-secondary'),
  color: token('text-primary'),
  hoverColor: token('text-primary'),
  activeColor: token('text-primary'),
  focusRing,
}
const severity = (name: string) => ({
  background: token(`status-${name}`),
  hoverBackground: token(`status-${name}`),
  activeBackground: token(`status-${name}`),
  borderColor: token(`status-${name}`),
  hoverBorderColor: token(`status-${name}`),
  activeBorderColor: token(`status-${name}`),
  color: token(name === 'danger' ? 'status-danger-contrast' : 'bg-canvas'),
  hoverColor: token(name === 'danger' ? 'status-danger-contrast' : 'bg-canvas'),
  activeColor: token(
    name === 'danger' ? 'status-danger-contrast' : 'bg-canvas',
  ),
  focusRing,
})
const buttonScheme = {
  root: {
    secondary,
    danger: severity('danger'),
    success: severity('success'),
    warn: severity('warning'),
    info: severity('info'),
  },
  outlined: Object.fromEntries(
    ['primary', 'secondary', 'danger', 'success', 'warn', 'info'].map(
      (name) => {
        const color =
          name === 'primary'
            ? token('action-primary')
            : name === 'secondary'
              ? token('text-primary')
              : token(`status-${name === 'warn' ? 'warning' : name}`)
        return [
          name,
          {
            color,
            borderColor: name === 'secondary' ? token('border-control') : color,
            hoverBackground: token('bg-hover'),
            activeBackground: token('bg-subtle'),
          },
        ]
      },
    ),
  ),
  text: Object.fromEntries(
    ['primary', 'secondary', 'danger', 'success', 'warn', 'info'].map(
      (name) => [
        name,
        {
          color:
            name === 'primary'
              ? token('action-primary')
              : name === 'secondary'
                ? token('text-primary')
                : token(`status-${name === 'warn' ? 'warning' : name}`),
          hoverBackground: token('bg-hover'),
          activeBackground: token('bg-subtle'),
        },
      ],
    ),
  ),
}
export const EiraPreset = definePreset(Aura, {
  primitive: {
    borderRadius: {
      xs: token('radius-sm'),
      sm: token('radius-sm'),
      md: token('radius-md'),
      lg: token('radius-lg'),
      xl: token('radius-dialog'),
    },
  },
  semantic: {
    transitionDuration: token('motion-duration'),
    focusRing,
    primary: Object.fromEntries(
      [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((n) => [
        n,
        token(
          `color-forest-${({ 100: 50, 600: 700 } as Record<number, number>)[n] ?? n}`,
        ),
      ]),
    ),
    formField: {
      borderRadius: token('radius-md'),
      focusRing: { ...focusRing, width: '0px' },
      paddingX: '0.75rem',
      paddingY: '0.625rem',
    },
    list: { option: { padding: '0.75rem', borderRadius: token('radius-sm') } },
    overlay: {
      select: {
        borderRadius: token('radius-lg'),
        shadow: token('shadow-overlay'),
      },
      popover: {
        borderRadius: token('radius-lg'),
        shadow: token('shadow-overlay'),
      },
      modal: {
        borderRadius: token('radius-dialog'),
        shadow: token('shadow-overlay'),
      },
      navigation: { shadow: token('shadow-overlay') },
    },
    colorScheme: { light: scheme, dark: scheme },
  },
  components: {
    button: {
      root: {
        borderRadius: token('radius-md'),
        gap: '0.5rem',
        paddingX: '0.875rem',
        paddingY: '0.625rem',
        label: { fontWeight: '500' },
        sm: { fontSize: '0.875rem', paddingY: '0.625rem' },
      },
      colorScheme: { light: buttonScheme, dark: buttonScheme },
    },
    tabs: {
      navButton: { width: token('size-touch') },
      tab: { padding: '0.75rem 1rem', fontWeight: '500' },
      tabpanel: { padding: '1.5rem 0' },
      colorScheme: {
        light: {
          tablist: { background: 'transparent' },
          tab: { background: 'transparent' },
          tabpanel: { background: 'transparent' },
        },
        dark: {
          tablist: { background: 'transparent' },
          tab: { background: 'transparent' },
          tabpanel: { background: 'transparent' },
        },
      },
    },
    dialog: { title: { fontWeight: '600', fontSize: '1.125rem' } },
    datepicker: {
      panel: { padding: '0.25rem' },
      date: { padding: '0', width: '2.75rem', height: '2.75rem' },
    },
  },
})
