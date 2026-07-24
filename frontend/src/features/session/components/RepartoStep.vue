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

function repartoInitial(nome: string): string {
  return nome.charAt(0).toUpperCase()
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
        <span class="reparto-avatar" aria-hidden="true">{{
          repartoInitial(reparto.nome)
        }}</span>
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
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  padding: 10px 16px;
  background: var(--canvas);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    transform 0.15s ease;
}

.reparto-avatar {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-sm);
  background: color-mix(in oklch, var(--color-primary) 14%, var(--surface));
  color: var(--color-primary-on-tint);
  font-size: 0.8125rem;
  font-weight: 700;
}

.reparto-name {
  font-size: 0.9375rem;
}

.reparto-item:hover {
  background: color-mix(in oklch, var(--color-primary) 6%, var(--canvas));
  border-color: color-mix(in oklch, var(--color-primary) 35%, var(--border));
}

.reparto-item:active {
  transform: scale(0.98);
}

.reparto-item:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.reparto-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
