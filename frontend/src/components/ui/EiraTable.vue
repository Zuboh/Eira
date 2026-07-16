<script setup lang="ts">
withDefaults(
  defineProps<{
    empty?: boolean
    emptyMessage?: string
  }>(),
  {
    empty: false,
    emptyMessage: 'Nessun dato da mostrare',
  },
)
</script>

<template>
  <section class="eira-table" :class="{ 'eira-table--empty': empty }">
    <div v-if="$slots.actions" class="eira-table__actions">
      <slot name="actions" />
    </div>

    <div v-if="empty" class="eira-table__empty" role="status">
      <slot name="empty">
        <p>{{ emptyMessage }}</p>
      </slot>
    </div>

    <div v-else class="eira-table__scroll">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.eira-table {
  width: 100%;
}

.eira-table__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.eira-table__scroll {
  width: 100%;
  overflow-x: auto;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.eira-table__scroll :deep(table) {
  width: 100%;
  min-width: 100%;
  border-collapse: collapse;
}

.eira-table__scroll :deep(th) {
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--steel);
  background: color-mix(in srgb, var(--canvas) 72%, var(--surface));
  border-bottom: 1px solid var(--border);
}

.eira-table__scroll :deep(td) {
  padding: 0.85rem 1rem;
  color: var(--ink);
  border-bottom: 1px solid var(--border);
}

.eira-table__scroll :deep(tbody tr:last-child td) {
  border-bottom: 0;
}

.eira-table__empty {
  display: grid;
  place-items: center;
  min-height: 8rem;
  padding: 2rem;
  text-align: center;
  color: var(--steel);
  background: var(--surface);
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.eira-table__empty :deep(p) {
  margin: 0;
}
</style>
