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
        type="button"
        class="reparto-item"
        :ref="i === 0 ? (el) => (firstButton = el as HTMLButtonElement) : undefined"
        :disabled="loading"
        @click="emit('choose', reparto)"
      >
        {{ reparto.nome }}
      </button>
    </li>
  </ul>
  <p v-if="!loading && reparti.length === 0 && !stepError" class="hint">
    Nessun reparto disponibile.
  </p>
</template>

<style scoped>
.subtitle {
  color: var(--steel);
  font-size: 0.9375rem;
  margin-bottom: 8px;
}

.hint {
  color: var(--steel);
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
  min-height: var(--size-touch);
  text-align: left;
  padding: 12px 16px;
  background: var(--canvas);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 0.9375rem;
  cursor: pointer;
  transition:
    background 0.15s ease,
    transform 0.15s ease;
}

.reparto-item:hover {
  background: var(--surface);
}

.reparto-item:active {
  transform: scale(0.98);
}
</style>
