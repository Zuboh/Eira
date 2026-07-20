<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: string
  label?: string
}>()

const STATE_MAP: Record<string, 'urgente' | 'pending' | 'attiva' | 'chiusa'> = {
  urgente: 'urgente',
  rifiutata: 'urgente',
  rifiutata_collega: 'urgente',
  rifiutata_caposala: 'urgente',
  normale: 'chiusa',
  in_attesa: 'pending',
  in_attesa_collega: 'pending',
  in_attesa_caposala: 'pending',
  attivo: 'attiva',
  attiva: 'attiva',
  approvata: 'attiva',
  sbar: 'pending',
  cedema: 'attiva',
  cambiata: 'chiusa',
  disattivato: 'chiusa',
  dimesso: 'chiusa',
}

const state = computed(() => STATE_MAP[props.status] ?? 'chiusa')
const pulse = computed(
  () =>
    props.status === 'in_attesa_collega' ||
    props.status === 'in_attesa_caposala',
)
</script>

<template>
  <span class="status-badge" :class="[state, { pulse }]">{{
    label ?? status
  }}</span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.urgente {
  background: color-mix(in srgb, var(--state-urgente) 15%, transparent);
  color: var(--state-urgente-on-tint);
}

.status-badge.pending {
  background: color-mix(in srgb, var(--state-pending) 15%, transparent);
  color: var(--state-pending-on-tint);
}

.status-badge.attiva {
  background: color-mix(in srgb, var(--state-attiva) 15%, transparent);
  color: var(--state-attiva-on-tint);
}

.status-badge.chiusa {
  background: color-mix(in srgb, var(--state-chiusa) 15%, transparent);
  color: var(--state-chiusa-on-tint);
}

.status-badge.pulse {
  animation: status-pulse 2s ease-in-out infinite;
}

@keyframes status-pulse {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}
</style>
