<script setup lang="ts">
import { computed, useSlots } from 'vue'

const props = defineProps<{
  title?: string | null
  message?: string | null
}>()

const slots = useSlots()
const hasActions = computed(() => Boolean(slots.actions))
const hasContent = computed(() =>
  Boolean(props.title || props.message || hasActions.value),
)
</script>

<template>
  <section v-if="hasContent" class="empty-state" aria-live="polite">
    <h2 v-if="title" class="empty-state__title">{{ title }}</h2>
    <p v-if="message" class="empty-state__message">{{ message }}</p>
    <div v-if="hasActions" class="empty-state__actions">
      <slot name="actions" />
    </div>
  </section>
</template>

<style scoped>
.empty-state {
  min-width: 0;
  padding-block: var(--eira-space-6);
  border-block: 1px solid var(--eira-border-default);
}
.empty-state__title {
  margin-bottom: var(--eira-space-2);
  font-size: 1rem;
  font-weight: 500;
}
.empty-state__message {
  color: var(--eira-text-secondary);
  font-size: var(--eira-font-body);
}
.empty-state__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--eira-space-2);
  margin-top: var(--eira-space-4);
}
</style>
