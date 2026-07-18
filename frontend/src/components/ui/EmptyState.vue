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
  width: 100%;
  padding: 24px;
  margin-top: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  text-align: center;
}

.empty-state__title {
  margin-bottom: 4px;
  font-size: 1rem;
  font-weight: 600;
}

.empty-state__message {
  margin: 0 auto;
  color: var(--steel);
  font-size: 0.875rem;
}

.empty-state__actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}
</style>
