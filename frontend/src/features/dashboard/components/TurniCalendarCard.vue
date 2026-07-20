<script setup lang="ts">
import { computed, ref } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import itLocale from '@fullcalendar/core/locales/it'
import EiraCard from '@/components/ui/EiraCard.vue'
import { formatDateShortIt } from '@/utils/dateFormat'
import type { EventApi, EventHoveringArg, EventInput } from '@fullcalendar/core'
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

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  locale: itLocale,
  firstDay: 1,
  height: 'auto',
  displayEventTime: false,
  dayMaxEvents: 2,
  events: props.events,
  eventMouseEnter: handleEventMouseEnter,
  eventMouseLeave: hideTooltip,
}))

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
  <EiraCard title="Calendario turni" class="turni-calendar-card">
    <FullCalendar :options="calendarOptions">
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
      <li v-for="item in legendItems" :key="item.className">
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
  --fc-today-bg-color: color-mix(
    in srgb,
    var(--color-primary) 12%,
    transparent
  );
  --fc-button-bg-color: var(--color-primary);
  --fc-button-border-color: var(--color-primary);
  --fc-button-hover-bg-color: var(--color-primary);
  --fc-button-hover-border-color: var(--color-primary);
  --fc-button-active-bg-color: var(--color-primary);
  --fc-button-active-border-color: var(--color-primary);
  color: var(--ink);
}

.turni-calendar-card :deep(.fc) {
  font-family: inherit;
  color: var(--ink);
}

.turni-calendar-card :deep(.fc-toolbar-title) {
  font-size: 1.125rem;
  text-transform: capitalize;
}

.turni-calendar-card :deep(.fc-button) {
  border-radius: var(--radius-sm);
  font-weight: 600;
  box-shadow: none;
}

/* FullCalendar ships its own unthemed dark focus ring
   (.fc-button:focus box-shadow rgba(44,62,80,.25)) — killed, clean focus */
.turni-calendar-card :deep(.fc-button:focus) {
  outline: none;
  box-shadow: none;
}

/* same unthemed dark ring, active/pressed+focus variant
   (.fc-button-primary.fc-button-active:focus / :active:focus) */
.turni-calendar-card
  :deep(.fc-button-primary:not(:disabled).fc-button-active:focus),
.turni-calendar-card :deep(.fc-button-primary:not(:disabled):active:focus) {
  box-shadow: none;
}

.turni-calendar-card :deep(.fc-col-header-cell-cushion),
.turni-calendar-card :deep(.fc-daygrid-day-number) {
  color: var(--steel);
  text-decoration: none;
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
  background: var(--turno-mattina);
  color: white;
}

.turni-calendar-card :deep(.turno-pomeriggio) {
  background: var(--turno-pomeriggio);
  color: white;
}

.turni-calendar-card :deep(.turno-notte) {
  background: var(--turno-notte);
  color: white;
}

.turni-calendar-card :deep(.turno-riposo) {
  background: var(--turno-riposo);
  color: white;
}

.turni-calendar-card :deep(.turno-ferie) {
  background: var(--turno-ferie);
  color: white;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
  color: var(--steel);
  font-size: 0.8125rem;
}

.legend li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
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
  .turni-calendar-card :deep(.fc-toolbar) {
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
