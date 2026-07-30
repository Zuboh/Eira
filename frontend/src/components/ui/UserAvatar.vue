<script setup lang="ts">
import { computed } from 'vue'
import { resolveBaseUrl } from '@/api/eiraClient'

const props = withDefaults(
  defineProps<{
    nome: string
    cognome: string
    avatarUrl?: string | null
    size?: string
  }>(),
  { avatarUrl: null, size: '2.25rem' },
)

const initials = computed(() =>
  `${props.nome.charAt(0)}${props.cognome.charAt(0)}`.toUpperCase(),
)

// avatar_url arriva dal backend come path relativo (es. /static/avatars/x.jpg)
// per restare disaccoppiato dall'host — in dev frontend e backend vivono su
// origin diverse (5173 vs 8000), quindi va risolto contro l'origin dell'API
// o il browser lo richiede (sbagliato) contro l'origin del frontend stesso.
const resolvedAvatarUrl = computed(() => {
  if (!props.avatarUrl) return null
  if (/^https?:\/\//.test(props.avatarUrl)) return props.avatarUrl
  return `${resolveBaseUrl()}${props.avatarUrl}`
})
</script>

<template>
  <img
    v-if="resolvedAvatarUrl"
    :src="resolvedAvatarUrl"
    :alt="`Foto profilo di ${nome} ${cognome}`"
    class="user-avatar"
    :style="{ width: size, height: size }"
  />
  <span
    v-else
    class="user-avatar user-avatar--initials"
    aria-hidden="true"
    :style="{ width: size, height: size }"
    >{{ initials }}</span
  >
</template>

<style scoped>
.user-avatar {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 50%;
}

.user-avatar:not(.user-avatar--initials) {
  object-fit: cover;
  border: 1px solid var(--border);
}

.user-avatar--initials {
  background: color-mix(in oklch, var(--color-primary) 14%, var(--surface));
  color: var(--color-primary-on-tint);
  font-size: 0.8125rem;
  font-weight: 700;
}
</style>
