<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import itLocale from '@fullcalendar/core/locales/it'
import Button from 'primevue/button'
import Popover from 'primevue/popover'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { formatDateShortIt } from '@/utils/dateFormat'
import EiraCard from '@/components/ui/EiraCard.vue'
import type {
  DatesSetArg,
  EventApi,
  EventHoveringArg,
  EventInput,
} from '@fullcalendar/core'
import type { TurnoCalendarEventProps } from '@/features/dashboard/infermiereCalendarViewModel'

const props = defineProps<{
  events: EventInput[]
}>()

const TOOLTIP_WIDTH = 288
const VIEWPORT_MARGIN = 12
const TOOLTIP_OFFSET = 10

const tooltip = ref<{
  visible: boolean
  x: number
  y: number
  placement: 'top' | 'bottom'
  props: TurnoCalendarEventProps | null
}>({
  visible: false,
  x: 0,
  y: 0,
  placement: 'top',
  props: null,
})

const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null)
const currentTitle = ref('')

const monthPickerRef = ref<InstanceType<typeof Popover> | null>(null)
const pickerYear = ref(new Date().getFullYear())

const MESI_IT = [
  'Gen',
  'Feb',
  'Mar',
  'Apr',
  'Mag',
  'Giu',
  'Lug',
  'Ago',
  'Set',
  'Ott',
  'Nov',
  'Dic',
]

/* Sotto 600px la griglia mensile tronca i chip a ~26px ("Ma…", "Rip…"):
   si passa alla vista lista, che mantiene il range mensile della toolbar
   e del selettore mese. */
const isCompact = useMediaQuery('(max-width: 599px)')
const viewName = computed(() =>
  isCompact.value ? 'listMonth' : 'dayGridMonth',
)

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, interactionPlugin, listPlugin],
  initialView: viewName.value,
  locale: itLocale,
  firstDay: 1,
  height: 'auto',
  headerToolbar: false as const,
  displayEventTime: false,
  dayMaxEvents: 2,
  noEventsText: 'Nessun turno questo mese',
  events: props.events,
  eventMouseEnter: handleEventMouseEnter,
  eventMouseLeave: hideTooltip,
  datesSet: (arg: DatesSetArg) => {
    currentTitle.value = arg.view.title
  },
}))

// initialView vale solo all'init: al cambio di viewport serve changeView.
watch(viewName, (view) => {
  calendarRef.value?.getApi().changeView(view)
})

function goToday() {
  calendarRef.value?.getApi().today()
}

function goPrev() {
  calendarRef.value?.getApi().prev()
}

function goNext() {
  calendarRef.value?.getApi().next()
}

function toggleMonthPicker(domEvent: Event) {
  const api = calendarRef.value?.getApi()
  if (api) pickerYear.value = api.getDate().getFullYear()
  monthPickerRef.value?.toggle(domEvent)
}

function pickerPrevYear() {
  pickerYear.value -= 1
}

function pickerNextYear() {
  pickerYear.value += 1
}

function selectMonth(monthIndex: number) {
  calendarRef.value
    ?.getApi()
    .gotoDate(new Date(pickerYear.value, monthIndex, 1))
  monthPickerRef.value?.hide()
}

const legendItems = [
  { className: 'turno-mattina', label: 'Mattina' },
  { className: 'turno-pomeriggio', label: 'Pomeriggio' },
  { className: 'turno-notte', label: 'Notte' },
  { className: 'turno-riposo', label: 'Riposo' },
  { className: 'turno-ferie', label: 'Ferie' },
]

function eventProps(event: EventApi) {
  return event.extendedProps as TurnoCalendarEventProps
}

function colleghiLabel(event: EventApi) {
  const colleghi = eventProps(event).colleghi
  return colleghi.length > 0 ? colleghi.join(', ') : 'Solo tu assegnato'
}

function eventAriaLabel(event: EventApi) {
  const props = eventProps(event)
  if (!props.isLavorativo) return props.tipoLabel
  return `${props.tipoLabel} ${props.orario}. In turno con te: ${colleghiLabel(event)}.`
}

function tooltipPosition(target: HTMLElement) {
  const rect = target.getBoundingClientRect()
  const halfWidth = TOOLTIP_WIDTH / 2
  const x = Math.min(
    Math.max(rect.left + rect.width / 2, halfWidth + VIEWPORT_MARGIN),
    window.innerWidth - halfWidth - VIEWPORT_MARGIN,
  )

  if (rect.top < 170) {
    return {
      x,
      y: rect.bottom + TOOLTIP_OFFSET,
      placement: 'bottom' as const,
    }
  }

  return {
    x,
    y: rect.top - TOOLTIP_OFFSET,
    placement: 'top' as const,
  }
}

function showTooltip(event: EventApi, target: HTMLElement) {
  const eventData = eventProps(event)
  if (!eventData.isLavorativo) {
    hideTooltip()
    return
  }

  tooltip.value = {
    visible: true,
    props: eventData,
    ...tooltipPosition(target),
  }
}

function hideTooltip() {
  tooltip.value.visible = false
}

function handleEventMouseEnter(arg: EventHoveringArg) {
  showTooltip(arg.event, arg.el)
}

function handleEventFocus(event: EventApi, domEvent: FocusEvent) {
  if (domEvent.currentTarget instanceof HTMLElement) {
    showTooltip(event, domEvent.currentTarget)
  }
}
</script>

<template>
  <EiraCard class="turni-calendar-card">
    <div class="calendar-toolbar">
      <h2 class="calendar-toolbar-title-wrap">
        <button
          type="button"
          class="calendar-toolbar-title"
          aria-haspopup="true"
          :aria-label="`Cambia mese, mese corrente: ${currentTitle}`"
          @click="toggleMonthPicker"
        >
          {{ currentTitle }}
          <i
            class="pi pi-chevron-down calendar-toolbar-title-caret"
            aria-hidden="true"
          />
        </button>
      </h2>
      <div class="calendar-toolbar-nav">
        <Button text label="Oggi" @click="goToday" />
        <Button
          text
          icon="pi pi-chevron-left"
          aria-label="Mese precedente"
          @click="goPrev"
        />
        <Button
          text
          icon="pi pi-chevron-right"
          aria-label="Mese successivo"
          @click="goNext"
        />
      </div>
    </div>

    <Popover ref="monthPickerRef" aria-label="Scegli mese e anno">
      <div class="month-picker">
        <div class="month-picker-year">
          <Button
            text
            icon="pi pi-chevron-left"
            aria-label="Anno precedente"
            @click="pickerPrevYear"
          />
          <span class="month-picker-year-label mono">{{ pickerYear }}</span>
          <Button
            text
            icon="pi pi-chevron-right"
            aria-label="Anno successivo"
            @click="pickerNextYear"
          />
        </div>
        <div class="month-picker-grid">
          <button
            v-for="(label, index) in MESI_IT"
            :key="label"
            type="button"
            class="month-picker-cell"
            @click="selectMonth(index)"
          >
            {{ label }}
          </button>
        </div>
      </div>
    </Popover>

    <FullCalendar ref="calendarRef" :options="calendarOptions">
      <template #eventContent="arg">
        <!-- In lista c'e' spazio: orario e colleghi inline invece del
             tooltip, che su touch non e' raggiungibile. -->
        <span v-if="arg.view.type === 'listMonth'" class="turno-list-event">
          <span class="turno-list-event-title">
            {{ eventProps(arg.event).tipoLabel }}
          </span>
          <span
            v-if="eventProps(arg.event).isLavorativo"
            class="turno-list-event-meta"
          >
            {{ eventProps(arg.event).orario }} ·
            {{ colleghiLabel(arg.event) }}
          </span>
        </span>
        <span
          v-else
          class="turno-event hit-area-touch"
          :class="{ 'with-tooltip': eventProps(arg.event).isLavorativo }"
          :tabindex="eventProps(arg.event).isLavorativo ? 0 : undefined"
          :aria-label="eventAriaLabel(arg.event)"
          @focus="handleEventFocus(arg.event, $event)"
          @blur="hideTooltip"
          @keydown.esc="hideTooltip"
          @click="showTooltip(arg.event, $event.currentTarget as HTMLElement)"
        >
          <span class="turno-event-title">{{ arg.event.title }}</span>
        </span>
      </template>
    </FullCalendar>

    <Teleport to="body">
      <div
        v-if="tooltip.visible && tooltip.props"
        class="turno-floating-tooltip"
        :class="`placement-${tooltip.placement}`"
        :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
        role="tooltip"
      >
        <span class="tooltip-kicker">
          {{ formatDateShortIt(tooltip.props.data) }}
        </span>
        <strong>{{ tooltip.props.tipoLabel }}</strong>
        <span class="tooltip-meta">{{ tooltip.props.orario }}</span>
        <span class="tooltip-section">In turno con te</span>
        <span v-if="tooltip.props.colleghi.length > 0" class="tooltip-list">
          <span
            v-for="collega in tooltip.props.colleghi"
            :key="collega"
            class="tooltip-collega"
          >
            {{ collega }}
          </span>
        </span>
        <span v-else class="tooltip-empty">Solo tu assegnato</span>
      </div>
    </Teleport>

    <ul class="legend" aria-label="Legenda turni">
      <li
        v-for="item in legendItems"
        :key="item.className"
        :class="item.className"
      >
        <span class="dot" :class="item.className" aria-hidden="true" />
        {{ item.label }}
      </li>
    </ul>
  </EiraCard>
</template>

<style scoped>
.turni-calendar-card {
  --fc-border-color: var(--eira-border-default);
  --fc-page-bg-color: var(--eira-bg-surface);
  --fc-neutral-bg-color: var(--eira-bg-canvas);
  --fc-today-bg-color: var(--eira-action-selected-background);
  --fc-list-event-hover-bg-color: var(--eira-bg-canvas);
  color: var(--eira-text-primary);
}

.turni-calendar-card :deep(.fc) {
  font-family: inherit;
  color: var(--eira-text-primary);
}

.turni-calendar-card :deep(.fc-day-today) {
  background: var(--eira-action-selected-background);
}

.turni-calendar-card :deep(.fc-day-today .fc-daygrid-day-frame) {
  border: 1px solid var(--eira-action-primary);
}

.turni-calendar-card :deep(.fc-day-today .fc-daygrid-day-number) {
  color: var(--eira-action-selected-text);
}

.turni-calendar-card :deep(.fc-scrollgrid) {
  border: 0;
}

.calendar-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.calendar-toolbar-title-wrap {
  margin: 0;
}

.calendar-toolbar-title {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: var(--eira-size-touch);
  padding: 4px 6px;
  border: none;
  border-radius: var(--eira-radius-md);
  background: transparent;
  font-family: var(--eira-font-sans);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--eira-text-primary);
  text-transform: capitalize;
  cursor: pointer;
  transition: color var(--eira-motion-duration) var(--eira-motion-easing);
}

.calendar-toolbar-title:hover {
  color: var(--eira-action-primary);
}

.calendar-toolbar-title:focus-visible {
  outline: 2px solid var(--eira-action-primary);
  outline-offset: 2px;
}

.calendar-toolbar-title-caret {
  font-size: 0.75rem;
  color: var(--eira-text-secondary);
}

.month-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px;
  min-width: 14rem;
}

.month-picker-year {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.month-picker-year-label {
  min-width: 3.5rem;
  text-align: center;
  font-weight: 600;
  color: var(--eira-text-primary);
}

.month-picker-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}

.month-picker-cell {
  min-height: var(--eira-size-touch);
  border: 1px solid transparent;
  border-radius: var(--eira-radius-md);
  background: transparent;
  color: var(--eira-text-primary);
  font-family: var(--eira-font-sans);
  font-size: 0.875rem;
  cursor: pointer;
  transition:
    background var(--eira-motion-duration) var(--eira-motion-easing),
    color var(--eira-motion-duration) var(--eira-motion-easing);
}

.month-picker-cell:hover {
  background: var(--eira-bg-canvas);
  color: var(--eira-action-primary);
}

.month-picker-cell:focus-visible {
  outline: 2px solid var(--eira-action-primary);
  outline-offset: 2px;
}

.calendar-toolbar-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.calendar-toolbar-nav :deep(.p-button) {
  min-width: var(--eira-size-touch);
  min-height: var(--eira-size-touch);
  padding: 0 var(--eira-space-2);
  border: none;
  border-radius: var(--eira-radius-md);
  background: transparent;
  font-family: var(--eira-font-sans);
  font-size: 1.125rem;
  color: var(--eira-text-primary);
  transition: color var(--eira-motion-duration) var(--eira-motion-easing);
}

.calendar-toolbar-nav :deep(.p-button .p-button-icon) {
  font-size: 1.125rem;
}

.calendar-toolbar-nav :deep(.p-button:hover) {
  background: transparent;
  color: var(--eira-action-primary);
}

.turni-calendar-card :deep(.fc-daygrid-day-number) {
  font-family: var(--eira-font-sans);
  font-size: 0.8125rem;
}

.turni-calendar-card :deep(.fc-col-header-cell-cushion),
.turni-calendar-card :deep(.fc-daygrid-day-number) {
  color: var(--eira-text-secondary);
  text-decoration: none;
}

.turni-calendar-card :deep(.fc-col-header-cell-cushion) {
  font-family: var(--eira-font-sans);
  font-weight: 600;
}

.turni-calendar-card :deep(.fc-col-header-cell) {
  background: transparent;
}

.turni-calendar-card :deep(.fc-daygrid-event) {
  border: 0;
  border-radius: var(--eira-radius-sm);
  padding: 2px 6px;
  /* 0.75rem scendeva sotto i 12px minimi con root < 16px */
  font-size: 0.8125rem;
  font-weight: 600;
}

.turni-calendar-card :deep(.fc-event-main) {
  color: inherit;
  width: 100%;
}

.turni-calendar-card :deep(.turno-event) {
  display: flex;
  width: 100%;
  max-width: 100%;
}

.turni-calendar-card :deep(.turno-event.with-tooltip) {
  cursor: help;
}

.turni-calendar-card :deep(.turno-event-title) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--eira-font-sans);
}

.turni-calendar-card :deep(.turno-event:focus-visible) {
  outline: 2px solid var(--eira-focus-ring);
  outline-offset: -2px;
}

.turni-calendar-card :deep(.fc-day-past) {
  background: var(--fc-neutral-bg-color);
}

.turni-calendar-card :deep(.fc-day-past .fc-daygrid-day-number) {
  color: var(--eira-text-secondary);
}

/* Le classi turno-* stanno sull'evento in entrambe le viste: qui il
   riempimento pieno vale solo per il chip della griglia, in lista
   colorano il pallino (vedi .fc-list-event-dot piu' sotto). */
.turni-calendar-card :deep(.fc-daygrid-event.turno-mattina) {
  background: var(--eira-shift-mattina-chip);
  color: var(--eira-shift-mattina);
}

.turni-calendar-card :deep(.fc-daygrid-event.turno-pomeriggio) {
  background: var(--eira-shift-pomeriggio-chip);
  color: var(--eira-shift-pomeriggio);
}

.turni-calendar-card :deep(.fc-daygrid-event.turno-notte) {
  background: var(--eira-shift-notte-chip);
  color: var(--eira-shift-notte);
}

.turni-calendar-card :deep(.fc-daygrid-event.turno-riposo) {
  background: var(--eira-shift-riposo-chip);
  color: var(--eira-shift-riposo);
}

.turni-calendar-card :deep(.fc-daygrid-event.turno-ferie) {
  background: var(--eira-shift-ferie-chip);
  color: var(--eira-shift-ferie);
}

/* --- Vista lista (<600px) --- */

.turni-calendar-card :deep(.fc-list) {
  border: 0;
}

.turni-calendar-card :deep(.fc-list-day-cushion) {
  background: var(--eira-bg-canvas);
  padding: var(--eira-space-2) var(--eira-space-3);
}

.turni-calendar-card :deep(.fc-list-day-text),
.turni-calendar-card :deep(.fc-list-day-side-text) {
  font-family: var(--eira-font-sans);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--eira-text-primary);
  text-decoration: none;
  text-transform: capitalize;
}

.turni-calendar-card :deep(.fc-list-event td) {
  padding: var(--eira-space-2) var(--eira-space-3);
}

.turni-calendar-card :deep(.fc-list-event:hover td) {
  background: var(--eira-bg-canvas);
}

/* displayEventTime e' false: la colonna orario resta vuota e ruberebbe
   larghezza, che a 375px e' la risorsa scarsa. */
.turni-calendar-card :deep(.fc-list-event-time) {
  display: none;
}

.turni-calendar-card :deep(.fc-list-event-dot) {
  border-color: var(--eira-text-secondary);
}

.turni-calendar-card :deep(.turno-mattina .fc-list-event-dot) {
  border-color: var(--eira-shift-mattina-chip);
}

.turni-calendar-card :deep(.turno-pomeriggio .fc-list-event-dot) {
  border-color: var(--eira-shift-pomeriggio-chip);
}

.turni-calendar-card :deep(.turno-notte .fc-list-event-dot) {
  border-color: var(--eira-shift-notte-chip);
}

.turni-calendar-card :deep(.turno-riposo .fc-list-event-dot) {
  border-color: var(--eira-shift-riposo-chip);
}

.turni-calendar-card :deep(.turno-ferie .fc-list-event-dot) {
  border-color: var(--eira-shift-ferie-chip);
}

.turni-calendar-card :deep(.turno-list-event) {
  display: flex;
  flex-direction: column;
  gap: 2px;
  /* riga a 44px anche quando il turno non ha meta (riposo/ferie) */
  min-height: var(--eira-size-touch);
  justify-content: center;
}

.turni-calendar-card :deep(.turno-list-event-title) {
  font-family: var(--eira-font-sans);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--eira-text-primary);
}

.turni-calendar-card :deep(.turno-list-event-meta) {
  font-family: var(--eira-font-sans);
  font-size: 0.8125rem;
  color: var(--eira-text-secondary);
}

.turni-calendar-card :deep(.fc-list-empty) {
  background: transparent;
  color: var(--eira-text-secondary);
  font-family: var(--eira-font-sans);
  font-size: 0.875rem;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
}

.legend li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px 3px 8px;
  border-radius: var(--eira-radius-sm);
  /* 0.75rem scendeva sotto i 12px minimi con root < 16px */
  font-size: 0.8125rem;
  font-weight: 600;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: var(--eira-radius-sm);
  flex-shrink: 0;
}

.legend li.turno-mattina {
  background: var(--eira-shift-mattina-chip);
  color: var(--eira-shift-mattina-on-tint);
}

.legend li.turno-pomeriggio {
  background: var(--eira-shift-pomeriggio-chip);
  color: var(--eira-shift-pomeriggio-on-tint);
}

.legend li.turno-notte {
  background: var(--eira-shift-notte-chip);
  color: var(--eira-shift-notte-on-tint);
}

.legend li.turno-riposo {
  background: var(--eira-shift-riposo-chip);
  color: var(--eira-shift-riposo-on-tint);
}

.legend li.turno-ferie {
  background: var(--eira-shift-ferie-chip);
  color: var(--eira-shift-ferie-on-tint);
}

.dot.turno-mattina {
  background: var(--eira-shift-mattina);
}

.dot.turno-pomeriggio {
  background: var(--eira-shift-pomeriggio);
}

.dot.turno-notte {
  background: var(--eira-shift-notte);
}

.dot.turno-riposo {
  background: var(--eira-shift-riposo);
}

.dot.turno-ferie {
  background: var(--eira-shift-ferie);
}

@media (max-width: 640px) {
  .calendar-toolbar {
    gap: 4px;
    margin-bottom: 8px;
  }

  .calendar-toolbar-title {
    padding-inline: 0;
    font-size: 1rem;
  }

  .calendar-toolbar-nav {
    gap: 0;
  }

  .legend {
    display: none;
  }
}

@media (max-width: 359px) {
  .calendar-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>

<style>
.turno-floating-tooltip {
  position: fixed;
  z-index: var(--eira-z-tooltip);
  display: flex;
  width: 18rem;
  max-width: calc(100vw - 24px);
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border: 1px solid var(--eira-border-default);
  border-radius: var(--eira-radius-lg);
  background: var(--eira-bg-surface);
  box-shadow: var(--eira-shadow-overlay);
  color: var(--eira-text-primary);
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1.35;
  pointer-events: none;
}

.turno-floating-tooltip.placement-top {
  transform: translate(-50%, -100%);
}

.turno-floating-tooltip.placement-bottom {
  transform: translateX(-50%);
}

.turno-floating-tooltip::after {
  content: '';
  position: absolute;
  left: 50%;
  border: 7px solid transparent;
  transform: translateX(-50%);
}

.turno-floating-tooltip.placement-top::after {
  top: 100%;
  border-top-color: var(--eira-bg-surface);
}

.turno-floating-tooltip.placement-bottom::after {
  bottom: 100%;
  border-bottom-color: var(--eira-bg-surface);
}

.turno-floating-tooltip .tooltip-kicker,
.turno-floating-tooltip .tooltip-meta,
.turno-floating-tooltip .tooltip-section,
.turno-floating-tooltip .tooltip-empty {
  color: var(--eira-text-secondary);
}

.turno-floating-tooltip .tooltip-section {
  margin-top: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.04em;
}

.turno-floating-tooltip .tooltip-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.turno-floating-tooltip .tooltip-collega {
  color: var(--eira-text-primary);
  font-weight: 600;
}
</style>
