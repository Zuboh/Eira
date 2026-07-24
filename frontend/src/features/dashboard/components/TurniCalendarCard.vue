<script setup lang="ts">
import { computed, ref } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import itLocale from '@fullcalendar/core/locales/it'
import Button from 'primevue/button'
import Popover from 'primevue/popover'
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

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  locale: itLocale,
  firstDay: 1,
  height: 'auto',
  headerToolbar: false as const,
  displayEventTime: false,
  dayMaxEvents: 2,
  events: props.events,
  eventMouseEnter: handleEventMouseEnter,
  eventMouseLeave: hideTooltip,
  datesSet: (arg: DatesSetArg) => {
    currentTitle.value = arg.view.title
  },
}))

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
  <EiraCard flush class="turni-calendar-card">
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

    <Popover ref="monthPickerRef">
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
        <span
          class="turno-event"
          :class="{ 'with-tooltip': eventProps(arg.event).isLavorativo }"
          :tabindex="eventProps(arg.event).isLavorativo ? 0 : undefined"
          :aria-label="eventAriaLabel(arg.event)"
          @focus="handleEventFocus(arg.event, $event)"
          @blur="hideTooltip"
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
  --fc-border-color: var(--border);
  --fc-page-bg-color: var(--surface);
  --fc-neutral-bg-color: var(--canvas);
  --fc-list-event-hover-bg-color: var(--canvas);
  color: var(--ink);
}

.turni-calendar-card :deep(.fc) {
  font-family: inherit;
  color: var(--ink);
}

.turni-calendar-card :deep(.fc-day-today) {
  background: color-mix(
    in srgb,
    var(--color-primary) 8%,
    var(--surface)
  ) !important;
  box-shadow: var(--shadow);
}

.turni-calendar-card :deep(.fc-day-today .fc-daygrid-day-frame) {
  border: 1px solid var(--color-primary);
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
  padding: 4px 6px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  font-family: var(--sans);
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--ink);
  text-transform: capitalize;
  cursor: pointer;
  transition: color 150ms ease-out;
}

.calendar-toolbar-title:hover {
  color: var(--color-primary);
}

.calendar-toolbar-title:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.calendar-toolbar-title-caret {
  font-size: 0.75rem;
  color: var(--steel);
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
  color: var(--ink);
}

.month-picker-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}

.month-picker-cell {
  min-height: var(--size-touch);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--ink);
  font-family: var(--sans);
  font-size: 0.875rem;
  cursor: pointer;
  transition:
    background 150ms ease-out,
    color 150ms ease-out;
}

.month-picker-cell:hover {
  background: var(--canvas);
  color: var(--color-primary);
}

.month-picker-cell:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.calendar-toolbar-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.calendar-toolbar-nav :deep(.p-button) {
  min-width: var(--size-touch);
  min-height: var(--size-touch);
  padding: 0 var(--space-2);
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  font-family: var(--sans);
  font-size: 1.125rem;
  color: var(--ink);
  transition: color 0.15s ease-out;
}

.calendar-toolbar-nav :deep(.p-button .p-button-icon) {
  font-size: 1.125rem;
}

.calendar-toolbar-nav :deep(.p-button:hover) {
  background: transparent;
  color: var(--color-primary);
}

.turni-calendar-card :deep(.fc-daygrid-day-number) {
  font-family: var(--mono);
  font-size: 0.8125rem;
}

.turni-calendar-card :deep(.fc-col-header-cell-cushion),
.turni-calendar-card :deep(.fc-daygrid-day-number) {
  color: var(--steel);
  text-decoration: none;
}

.turni-calendar-card :deep(.fc-col-header-cell-cushion) {
  font-family: var(--sans);
  font-weight: 600;
}

.turni-calendar-card :deep(.fc-daygrid-event) {
  border: 0;
  border-radius: 999px;
  padding: 2px 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.turni-calendar-card :deep(.fc-event-main) {
  width: 100%;
}

.turni-calendar-card :deep(.turno-event) {
  display: flex;
  width: 100%;
  max-width: 100%;
  outline: none;
}

.turni-calendar-card :deep(.turno-event.with-tooltip) {
  cursor: help;
}

.turni-calendar-card :deep(.turno-event-title) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--sans);
}

.turni-calendar-card :deep(.turno-event:focus-visible) {
  border-radius: 999px;
  outline: 2px solid white;
  outline-offset: 2px;
}

.turni-calendar-card :deep(.fc-day-past) {
  background: var(--fc-neutral-bg-color);
}

.turni-calendar-card :deep(.fc-day-past .fc-daygrid-day-number) {
  color: color-mix(in srgb, var(--steel) 60%, transparent);
}

.turni-calendar-card :deep(.fc-day-past .fc-daygrid-event) {
  opacity: 0.5;
}

.turni-calendar-card :deep(.turno-mattina) {
  background: var(--turno-mattina-chip);
  color: white;
}

.turni-calendar-card :deep(.turno-pomeriggio) {
  background: var(--turno-pomeriggio-chip);
  color: white;
}

.turni-calendar-card :deep(.turno-notte) {
  background: var(--turno-notte-chip);
  color: white;
}

.turni-calendar-card :deep(.turno-riposo) {
  background: var(--turno-riposo-chip);
  color: white;
}

.turni-calendar-card :deep(.turno-ferie) {
  background: var(--turno-ferie-chip);
  color: white;
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
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  flex-shrink: 0;
}

.legend li.turno-mattina {
  background: color-mix(in srgb, var(--turno-mattina) 15%, transparent);
  color: var(--turno-mattina);
}

.legend li.turno-pomeriggio {
  background: color-mix(in srgb, var(--turno-pomeriggio) 15%, transparent);
  color: var(--turno-pomeriggio);
}

.legend li.turno-notte {
  background: color-mix(in srgb, var(--turno-notte) 15%, transparent);
  color: var(--turno-notte);
}

.legend li.turno-riposo {
  background: color-mix(in srgb, var(--turno-riposo) 15%, transparent);
  color: var(--turno-riposo);
}

.legend li.turno-ferie {
  background: color-mix(in srgb, var(--turno-ferie) 15%, transparent);
  color: var(--turno-ferie);
}

.dot.turno-mattina {
  background: var(--turno-mattina);
}

.dot.turno-pomeriggio {
  background: var(--turno-pomeriggio);
}

.dot.turno-notte {
  background: var(--turno-notte);
}

.dot.turno-riposo {
  background: var(--turno-riposo);
}

.dot.turno-ferie {
  background: var(--turno-ferie);
}

@media (max-width: 640px) {
  .calendar-toolbar {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }
}
</style>

<style>
.turno-floating-tooltip {
  position: fixed;
  z-index: 9999;
  display: flex;
  width: 18rem;
  max-width: calc(100vw - 24px);
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: var(--shadow-lg);
  color: var(--ink);
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
  border-top-color: var(--surface);
}

.turno-floating-tooltip.placement-bottom::after {
  bottom: 100%;
  border-bottom-color: var(--surface);
}

.turno-floating-tooltip .tooltip-kicker,
.turno-floating-tooltip .tooltip-meta,
.turno-floating-tooltip .tooltip-section,
.turno-floating-tooltip .tooltip-empty {
  color: var(--steel);
}

.turno-floating-tooltip .tooltip-section {
  margin-top: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.turno-floating-tooltip .tooltip-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.turno-floating-tooltip .tooltip-collega {
  color: var(--ink);
  font-weight: 600;
}
</style>
