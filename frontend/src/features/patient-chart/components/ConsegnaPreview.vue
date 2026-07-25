<script setup lang="ts">
import Button from 'primevue/button'
import type { ConsegnaSection } from '@/features/patient-chart/consegnaSections'

withDefaults(
  defineProps<{
    sections: ConsegnaSection[]
    values: Record<string, string>
    hasOrphanText: boolean
    copiedKeys?: string[]
    canCopyForward?: boolean
  }>(),
  {
    copiedKeys: () => [],
    canCopyForward: false,
  },
)
const emit = defineEmits<{
  quickFill: [key: string]
  copyForwardSection: [key: string]
}>()
</script>

<template>
  <section class="preview" aria-live="polite">
    <h3>Come verrà salvata</h3>
    <p v-if="hasOrphanText" class="orphan">
      Il testo scritto prima della prima sigla è finito in
      {{ sections[0].label }}.
    </p>

    <dl>
      <div v-for="section in sections" :key="section.key" class="row">
        <dt>
          <span class="sigla">{{ section.sigla }}</span>
          {{ section.label }}
          <span
            v-if="copiedKeys.includes(section.key)"
            class="copied"
            :title="`${section.label} ripresa dalla consegna precedente`"
            >↻<span class="sr-only">
              ripresa dalla consegna precedente</span
            ></span
          >
        </dt>
        <dd v-if="values[section.key]">{{ values[section.key] }}</dd>
        <dd v-else class="empty">
          <span class="hint">{{ section.hint }}</span>
          <Button
            type="button"
            severity="secondary"
            text
            size="small"
            :label="`Segna «invariato»`"
            :aria-label="`Segna ${section.label} come invariato`"
            @click="emit('quickFill', section.key)"
          />
          <Button
            v-if="canCopyForward"
            type="button"
            severity="secondary"
            text
            size="small"
            label="Riprendi"
            :aria-label="`Riprendi ${section.label} dalla consegna precedente`"
            @click="emit('copyForwardSection', section.key)"
          />
        </dd>
      </div>
    </dl>
  </section>
</template>

<style scoped>
.preview {
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: color-mix(in srgb, var(--surface) 88%, var(--color-primary));
}

.preview h3 {
  margin: 0 0 8px;
  font-size: 0.95rem;
}

.orphan {
  margin: 0 0 12px;
  color: var(--muted);
  font-size: 0.875rem;
}

dl {
  display: grid;
  gap: 10px;
  margin: 0;
}

.row {
  display: grid;
  grid-template-columns: minmax(9rem, auto) minmax(0, 1fr);
  align-items: baseline;
  gap: 4px 12px;
}

dt {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-weight: 600;
  font-size: 0.875rem;
}

.sigla {
  display: inline-grid;
  place-items: center;
  min-width: 1.4rem;
  padding: 1px 4px;
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--muted);
  font-size: 0.75rem;
}

dd {
  margin: 0;
  white-space: pre-wrap;
}

dd.empty {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 8px;
}

.copied {
  color: var(--muted);
  font-weight: 400;
}

.hint {
  color: var(--muted);
  font-size: 0.875rem;
  font-style: italic;
}

@media (max-width: 720px) {
  .row {
    grid-template-columns: 1fr;
  }
}
</style>
