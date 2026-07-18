<script setup lang="ts">
import { computed } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import itLocale from '@fullcalendar/core/locales/it'
import EiraCard from '@/components/ui/EiraCard.vue'
import type { EventInput } from '@fullcalendar/core'

const props = defineProps<{
  events: EventInput[]
}>()

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  locale: itLocale,
  firstDay: 1,
  height: 'auto',
  displayEventTime: false,
  dayMaxEvents: 2,
  events: props.events,
}))

const legendItems = [
  { className: 'turno-mattina', label: 'Mattina' },
  { className: 'turno-pomeriggio', label: 'Pomeriggio' },
  { className: 'turno-notte', label: 'Notte' },
  { className: 'turno-riposo', label: 'Riposo' },
  { className: 'turno-ferie', label: 'Ferie' },
]
</script>

<template>
  <EiraCard title="Calendario turni" class="turni-calendar-card">
    <FullCalendar :options="calendarOptions" />
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
  --fc-today-bg-color: color-mix(in srgb, var(--color-primary) 12%, transparent);
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
