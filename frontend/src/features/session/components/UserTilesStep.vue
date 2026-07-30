<script setup lang="ts">
import { ref } from 'vue'
import type { UtenteTile } from '@/api/reparti'
import UserAvatar from '@/components/ui/UserAvatar.vue'

defineProps<{
  utenti: UtenteTile[]
  loading: boolean
}>()

const emit = defineEmits<{
  select: [utente: UtenteTile]
  changeReparto: []
}>()

const firstButton = ref<HTMLButtonElement | null>(null)

const ROLE_LABEL: Record<string, string> = {
  infermiere: 'Infermiere',
  caposala: 'Caposala',
}

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
        <UserAvatar
          :nome="utente.nome"
          :cognome="utente.cognome"
          :avatar-url="utente.avatar_url"
          size="2.25rem"
        />
        <span class="tile-name">{{ utente.nome }} {{ utente.cognome }}</span>
        <span class="tile-role">{{ ROLE_LABEL[utente.ruolo] ?? utente.ruolo }}</span>
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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: var(--canvas);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    transform 0.15s ease;
}

.tile-name {
  font-size: 0.9375rem;
  font-weight: 600;
  text-align: center;
}

.tile-role {
  font-size: 0.8125rem;
  color: var(--steel);
}

.tile:hover {
  background: color-mix(in oklch, var(--color-primary) 6%, var(--canvas));
  border-color: color-mix(in oklch, var(--color-primary) 35%, var(--border));
}

.tile:active {
  transform: scale(0.98);
}

.tile:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.tile:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.link-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>
