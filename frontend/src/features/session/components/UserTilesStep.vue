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
        <span class="tile-role">{{
          ROLE_LABEL[utente.ruolo] ?? utente.ruolo
        }}</span>
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
  color: var(--eira-text-secondary);
  font-size: 0.9375rem;
  margin-bottom: 8px;
}

.hint {
  color: var(--eira-text-secondary);
  font-size: 0.875rem;
}

.tile-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
}

.tile {
  min-height: var(--eira-size-touch);
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--eira-bg-subtle);
  border: 1px solid var(--eira-border-default);
  border-radius: var(--eira-radius-md);
  cursor: pointer;
  transition:
    background var(--eira-motion-duration) var(--eira-motion-easing),
    border-color var(--eira-motion-duration) var(--eira-motion-easing),
    opacity var(--eira-motion-duration) var(--eira-motion-easing);
}

.tile-name {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 0.9375rem;
  font-weight: 600;
  text-align: left;
}

.tile-role {
  font-size: 0.8125rem;
  color: var(--eira-text-secondary);
}

.tile:hover {
  background: var(--eira-bg-hover);
  border-color: color-mix(
    in oklch,
    var(--eira-action-primary) 35%,
    var(--eira-border-default)
  );
}

.tile:focus-visible {
  outline: 2px solid var(--eira-action-primary);
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
  color: var(--eira-text-secondary);
  font-size: 0.8125rem;
  text-decoration: underline;
  cursor: pointer;
  align-self: flex-start;
  min-height: var(--eira-size-touch);
}

.link-btn:focus-visible {
  outline: 2px solid var(--eira-action-primary);
  outline-offset: 2px;
}
</style>
