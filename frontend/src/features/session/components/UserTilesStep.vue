<script setup lang="ts">
import { ref } from 'vue'
import type { UtenteTile } from '@/api/reparti'

defineProps<{
  utenti: UtenteTile[]
  loading: boolean
}>()

const emit = defineEmits<{
  select: [utente: UtenteTile]
  changeReparto: []
}>()

const firstButton = ref<HTMLButtonElement | null>(null)

function focusFirst() {
  firstButton.value?.focus()
}

defineExpose({ focusFirst })
</script>

<template>
  <p class="subtitle">Seleziona il tuo nome.</p>
  <template v-if="utenti.length > 0">
    <div class="tile-grid">
      <button
        v-for="(utente, i) in utenti"
        :key="utente.id"
        :ref="
          i === 0 ? (el) => (firstButton = el as HTMLButtonElement) : undefined
        "
        type="button"
        class="tile"
        :disabled="loading"
        @click="emit('select', utente)"
      >
        {{ utente.nome }} {{ utente.cognome }}
      </button>
    </div>
  </template>
  <p v-else class="hint">Nessun utente in questo reparto.</p>
  <button type="button" class="link-btn" @click="emit('changeReparto')">
    Cambia reparto
  </button>
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

.tile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}

.tile {
  min-height: var(--size-touch);
  padding: 16px 12px;
  background: var(--canvas);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 0.9375rem;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
  transition:
    background 0.15s ease,
    transform 0.15s ease;
}

.tile:hover {
  background: var(--surface);
}

.tile:active {
  transform: scale(0.98);
}

.link-btn {
  background: none;
  border: none;
  padding: 4px 0;
  color: var(--steel);
  font-size: 0.8125rem;
  text-decoration: underline;
  cursor: pointer;
  align-self: flex-start;
  min-height: var(--size-touch);
}
</style>
