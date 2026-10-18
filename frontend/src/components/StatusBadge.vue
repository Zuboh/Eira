<script setup lang="ts">
import { computed } from 'vue'
import { STATO_CAMBIO_TURNO_LABEL } from '@/features/cambi-turno/constants'

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
  sbar: 'chiusa',
  soapie: 'chiusa',
  cambiata: 'chiusa',
  disattivato: 'chiusa',
  dimesso: 'chiusa',
}

const state = computed(() => STATE_MAP[props.status] ?? 'chiusa')
const STATUS_LABEL: Record<string, string> = {
  ...STATO_CAMBIO_TURNO_LABEL,
  urgente: 'Urgente',
  normale: 'Normale',
  in_attesa: 'In attesa',
  attivo: 'Attivo',
  attiva: 'Attiva',
  approvata: 'Approvata',
  rifiutata: 'Rifiutata',
  cambiata: 'Cambiata',
  disattivato: 'Disattivato',
  dimesso: 'Dimesso',
}
const displayLabel = computed(
  () => props.label ?? STATUS_LABEL[props.status] ?? props.status,
)
</script>

<template>
  <span class="status-badge" :class="state">
    {{ displayLabel }}
  </span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--eira-radius-sm);
  font-size: var(--eira-font-small);
  font-weight: 500;
  line-height: 1.5;
  white-space: normal;
}
.status-badge.urgente {
  color: var(--eira-status-danger);
  background: var(--eira-status-danger-background);
}
.status-badge.pending {
  color: var(--eira-status-warning);
  background: var(--eira-status-warning-background);
}
.status-badge.attiva {
  color: var(--eira-status-success);
  background: var(--eira-status-success-background);
}
.status-badge.chiusa {
  color: var(--eira-status-neutral);
  background: var(--eira-status-neutral-background);
}
</style>
