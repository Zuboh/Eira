<script setup lang="ts">
import { RouterLink } from 'vue-router'
import Button from 'primevue/button'
import EmptyState from '@/components/ui/EmptyState.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { formatDateTimeCompactIt } from '@/utils/dateFormat'
import type {
  ClinicalTimelineTabEmits,
  ClinicalTimelineTabProps,
} from '@/features/patient-chart/types'

defineProps<ClinicalTimelineTabProps>()

const emit = defineEmits<ClinicalTimelineTabEmits>()
</script>

<template>
  <div class="panel-header">
    <Button
      v-if="canCreate"
      v-tooltip.top="'Nuova consegna'"
      icon="pi pi-plus"
      label="Nuova consegna"
      size="small"
      @click="emit('newEntry')"
    />
    <RouterLink
      v-tooltip.top="'Vedi tutte le consegne'"
      :to="{ name: 'consegne-sbar' }"
      class="diario-link"
      aria-label="Vedi tutte le consegne"
    >
      Vedi tutte le consegne
      <i class="pi pi-arrow-right" aria-hidden="true" />
    </RouterLink>
  </div>

  <EmptyState
    v-if="entries.length === 0"
    title="Nessuna consegna presente"
    message="Le consegne SBAR e SOAPIE compariranno qui in ordine cronologico."
  />

  <div v-else class="timeline">
    <article v-for="entry in entries" :key="entry.id" class="timeline-entry">
      <div class="timeline-entry-header">
        <div>
          <h2>{{ entry.title }}</h2>
          <p class="meta mono">
            {{ nomeAutore(entry.autoreId) }} ·
            {{ formatDateTimeCompactIt(entry.timestamp) }}
          </p>
        </div>
        <div class="badges">
          <StatusBadge :status="entry.tipo" :label="entry.tipo.toUpperCase()" />
          <StatusBadge v-if="entry.priorita" :status="entry.priorita" />
        </div>
      </div>
      <dl class="entry-sections">
        <div v-for="section in entry.sections" :key="section.label">
          <dt>{{ section.label }}</dt>
          <dd>{{ section.value }}</dd>
        </div>
      </dl>
    </article>
  </div>
</template>

<style scoped>
.entry-sections {
  display: grid;
  gap: var(--eira-space-3);
  margin: 0;
}
.entry-sections > div {
  display: grid;
  grid-template-columns: 9rem minmax(0, 1fr);
  gap: var(--eira-space-3);
}
.entry-sections dt {
  font-size: var(--eira-font-small);
  color: var(--eira-text-secondary);
  padding-top: 2px;
}
.entry-sections dd {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: var(--eira-font-clinical);
  max-width: 75ch;
}
@media (max-width: 47.9375rem) {
  .entry-sections > div {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--eira-space-1);
  }
}

.panel-header {
  flex-wrap: wrap;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 0;
}

.diario-link {
  min-height: var(--eira-size-touch);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  border: 1px solid var(--eira-border-default);
  border-radius: var(--eira-radius-md);
  color: var(--eira-text-primary);
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
}

.diario-link:hover {
  background: var(--eira-bg-subtle);
}

.timeline {
  display: flex;
  flex-direction: column;
}

.timeline-entry {
  padding: 16px 0;
}

.timeline-entry + .timeline-entry {
  border-top: 1px solid var(--eira-border-default);
}

.timeline-entry-header {
  flex-wrap: wrap;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.timeline-entry-header h2 {
  margin: 0;
  font-size: 1rem;
}

.meta {
  margin: 4px 0 0;
  color: var(--eira-text-secondary);
  font-size: 0.8125rem;
}

.badges {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 8px;
}

.mono {
  font-family: var(--eira-font-sans);
}
</style>
