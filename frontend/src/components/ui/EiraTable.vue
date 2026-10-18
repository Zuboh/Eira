<script setup lang="ts">
import Button from 'primevue/button'
import InlineError from './InlineError.vue'
defineEmits<{ retry: [] }>()
withDefaults(
  defineProps<{
    label?: string
    error?: string | null
    retryable?: boolean
    empty?: boolean
    emptyMessage?: string
    loading?: boolean
    loadingRows?: number
    flush?: boolean
    maxHeight?: string
  }>(),
  {
    label: 'Tabella dati',
    error: null,
    retryable: false,
    empty: false,
    emptyMessage: 'Nessun dato da mostrare',
    loading: false,
    loadingRows: 4,
    flush: false,
    maxHeight: undefined,
  },
)
</script>

<template>
  <section
    class="eira-table"
    :class="{ 'eira-table--empty': empty, 'eira-table--flush': flush }"
  >
    <div v-if="$slots.actions" class="eira-table__actions">
      <slot name="actions" />
    </div>

    <div
      v-if="loading"
      class="eira-table__skeleton"
      role="status"
      aria-live="polite"
      aria-label="Caricamento dati"
    >
      <div v-for="n in loadingRows" :key="n" class="skeleton-row">
        <span class="skeleton-bar skeleton-bar--lg" />
        <span class="skeleton-bar skeleton-bar--md" />
        <span class="skeleton-bar skeleton-bar--sm" />
      </div>
    </div>

    <div v-else-if="error" class="eira-table__error">
      <InlineError :message="error" />
      <Button
        v-if="retryable"
        label="Riprova"
        severity="secondary"
        outlined
        @click="$emit('retry')"
      />
    </div>
    <div v-else-if="empty" class="eira-table__empty" role="status">
      <slot name="empty">
        <p>{{ emptyMessage }}</p>
      </slot>
    </div>

    <div
      v-else
      class="eira-table__scroll"
      role="region"
      :aria-label="label"
      tabindex="0"
      :class="{ 'eira-table__scroll--bounded': maxHeight }"
      :style="{ maxHeight }"
    >
      <slot />
    </div>
  </section>
</template>

<style scoped>
.eira-table {
  width: 100%;
  min-width: 0;
  max-width: 100%;
}
.eira-table__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--eira-space-2);
  margin-bottom: var(--eira-space-3);
}
.eira-table__scroll {
  position: relative;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: auto;
  contain: inline-size;
  border-block: 1px solid var(--eira-border-default);
}
.eira-table__scroll:focus-visible {
  outline-offset: -2px;
}
.eira-table__scroll--bounded :deep(th) {
  position: sticky;
  top: 0;
  z-index: 1;
}
.eira-table__scroll :deep(table) {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}
.eira-table__scroll :deep(th) {
  padding: var(--eira-space-3);
  text-align: left;
  font-size: var(--eira-font-small);
  font-weight: 500;
  white-space: nowrap;
  color: var(--eira-text-secondary);
  background: var(--eira-bg-subtle);
  border-bottom: 1px solid var(--eira-border-default);
}
.eira-table__scroll :deep(td) {
  padding: var(--eira-space-2) var(--eira-space-3);
  color: var(--eira-text-primary);
  border-bottom: 1px solid var(--eira-border-default);
  vertical-align: middle;
}
.eira-table__scroll :deep(.numeric) {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.eira-table__scroll :deep(.mono) {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.eira-table__scroll :deep(tbody tr:hover) {
  background: var(--eira-bg-subtle);
}
.eira-table__scroll :deep(tbody tr:last-child td) {
  border-bottom: 0;
}
.eira-table__scroll :deep(td a) {
  display: inline-flex;
  align-items: center;
  min-height: var(--eira-size-touch);
  min-width: var(--eira-size-touch);
  font-weight: 500;
  text-decoration: none;
}
.eira-table__scroll :deep(td a:hover) {
  text-decoration: underline;
}
.eira-table__empty,
.eira-table__error {
  display: grid;
  justify-items: start;
  gap: var(--eira-space-3);
  padding: var(--eira-space-6) 0;
  color: var(--eira-text-secondary);
  border-block: 1px solid var(--eira-border-default);
}
.eira-table__skeleton {
  overflow: hidden;
}
.skeleton-row {
  display: flex;
  gap: var(--eira-space-4);
  padding: var(--eira-space-5) var(--eira-space-3);
  border-bottom: 1px solid var(--eira-border-default);
}
.skeleton-bar {
  height: 14px;
  border-radius: var(--eira-radius-sm);
  background: var(--eira-bg-hover);
}
.skeleton-bar--lg {
  flex: 3;
}
.skeleton-bar--md {
  flex: 4;
}
.skeleton-bar--sm {
  flex: 2;
}
</style>
