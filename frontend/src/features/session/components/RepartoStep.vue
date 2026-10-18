<script setup lang="ts">
import { ref } from 'vue'
import type { Reparto } from '@/api/reparti'

defineProps<{
  reparti: Reparto[]
  loading: boolean
  stepError?: string | null
}>()

const emit = defineEmits<{
  choose: [reparto: Reparto]
}>()

const firstButton = ref<HTMLButtonElement | null>(null)

function focusFirst() {
  firstButton.value?.focus()
}

defineExpose({ focusFirst })
</script>

<template>
  <p class="subtitle">Seleziona il reparto di questo dispositivo.</p>
  <ul class="reparto-list">
    <li v-for="(reparto, i) in reparti" :key="reparto.id">
      <button
        :ref="
          i === 0 ? (el) => (firstButton = el as HTMLButtonElement) : undefined
        "
        type="button"
        class="reparto-item"
        :disabled="loading"
        @click="emit('choose', reparto)"
      >
        <i class="pi pi-building" aria-hidden="true" />
        <span class="reparto-name">{{ reparto.nome }}</span>
      </button>
    </li>
  </ul>
  <p v-if="!loading && reparti.length === 0 && !stepError" class="hint">
    Nessun reparto disponibile.
  </p>
</template>

<style scoped>
.subtitle {
  color: var(--eira-text-secondary);
  font-size: 0.9375rem;
  margin-bottom: 8px;
}

.hint {
  color: var(--eira-text-secondary);
  font-size: 0.875rem;
}

.reparto-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reparto-item {
  width: 100%;
  min-height: var(--eira-size-touch);
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  padding: 10px 16px;
  background: var(--eira-bg-subtle);
  border: 1px solid var(--eira-border-default);
  border-radius: var(--eira-radius-md);
  cursor: pointer;
  transition:
    background var(--eira-motion-duration) var(--eira-motion-easing),
    border-color var(--eira-motion-duration) var(--eira-motion-easing),
    opacity var(--eira-motion-duration) var(--eira-motion-easing);
}

.reparto-name {
  font-size: 0.9375rem;
}

.reparto-item:hover {
  background: var(--eira-bg-hover);
  border-color: color-mix(
    in oklch,
    var(--eira-action-primary) 35%,
    var(--eira-border-default)
  );
}

.reparto-item:focus-visible {
  outline: 2px solid var(--eira-action-primary);
  outline-offset: 2px;
}

.reparto-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
