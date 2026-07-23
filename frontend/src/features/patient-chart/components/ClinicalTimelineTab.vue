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
      label="Nuova consegna"
      size="small"
      @click="emit('newEntry')"
    />
    <RouterLink :to="{ name: 'consegne-sbar' }" class="diario-link">
      Vedi tutte le consegne
    </RouterLink>
  </div>

  <EmptyState
    v-if="entries.length === 0"
    title="Nessuna consegna presente"
    message="Le consegne SBAR e CEDEMA compariranno qui in ordine cronologico."
  />

  <div v-else class="timeline">
    <article v-for="entry in entries" :key="entry.id" class="timeline-entry">
      <div class="timeline-entry-header">
        <div>
          <h3>{{ entry.title }}</h3>
          <p class="meta mono">
            {{ formatDateTimeCompactIt(entry.timestamp) }}
          </p>
        </div>
        <div class="badges">
          <StatusBadge :status="entry.tipo" :label="entry.tipo.toUpperCase()" />
          <StatusBadge
            v-if="entry.priorita"
            :status="entry.priorita"
            :label="entry.priorita"
          />
        </div>
      </div>
      <pre class="body">{{ entry.body }}</pre>
    </article>
  </div>
</template>

<style scoped>
.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 0;
}

.diario-link {
  min-height: var(--size-touch);
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--ink);
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
}

.diario-link:hover {
  background: var(--surface-muted);
}

.timeline {
  display: flex;
  flex-direction: column;
}

.timeline-entry {
  padding: 16px 0;
}

.timeline-entry + .timeline-entry {
  border-top: 1px solid var(--border);
}

.timeline-entry-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.timeline-entry-header h3 {
  margin: 0;
  font-size: 1rem;
}

.meta {
  margin: 4px 0 0;
  color: var(--steel);
  font-size: 0.8125rem;
}

.badges {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 8px;
}

.body {
  margin: 0;
  white-space: pre-wrap;
  font-family: inherit;
  color: var(--ink);
}

.mono {
  font-family: var(--mono);
}
</style>
