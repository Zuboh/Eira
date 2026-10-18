<script setup lang="ts">
import { RouterLink } from 'vue-router'
import EiraCard from '@/components/ui/EiraCard.vue'

defineProps<{
  turniScopertiCount: number
  cambiDaApprovareCount: number
  personaleInAttesaCount: number
  loading: boolean
}>()
</script>

<template>
  <EiraCard title="Priorità operative">
    <div class="ledger" :aria-busy="loading">
      <div class="ledger-row" :class="{ actionable: turniScopertiCount > 0 }">
        <span class="ledger-label">Turni scoperti (7 gg)</span>
        <span class="ledger-value mono">
          {{ loading ? '—' : turniScopertiCount }}
        </span>
      </div>
      <div
        class="ledger-row"
        :class="{ actionable: cambiDaApprovareCount > 0 }"
      >
        <span class="ledger-label">Cambi da approvare</span>
        <span class="ledger-value mono">
          {{ loading ? '—' : cambiDaApprovareCount }}
        </span>
      </div>
      <RouterLink
        :to="{ name: 'caposala-staff' }"
        class="ledger-row ledger-link"
        :class="{ actionable: personaleInAttesaCount > 0 }"
      >
        <span class="ledger-label">Personale in attesa</span>
        <span class="ledger-value mono">
          {{ loading ? '—' : personaleInAttesaCount }}
        </span>
      </RouterLink>
    </div>
  </EiraCard>
</template>

<style scoped>
.ledger {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--eira-space-6);
}

.ledger-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  min-height: var(--eira-size-touch);
  padding: 10px 14px;
}

.ledger-row + .ledger-row {
  border: 0;
}

.ledger-label {
  color: var(--eira-text-secondary);
  font-size: 0.8125rem;
}

.ledger-value {
  color: var(--eira-text-primary);
  font-size: 1.25rem;
  font-weight: 600;
}

.ledger-row.actionable .ledger-value {
  color: var(--eira-status-warning);
}

.ledger-link {
  color: inherit;
  text-decoration: none;
}

.ledger-link:hover .ledger-label {
  color: var(--eira-action-primary);
}

.ledger-link:focus-visible {
  border-radius: 0 0 var(--eira-radius-md) var(--eira-radius-md);
  outline: 2px solid var(--eira-action-primary);
  outline-offset: 2px;
}

.mono {
  font-family: var(--eira-font-sans);
}
@media (max-width: 47.9375rem) {
  .ledger {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--eira-space-2);
  }
}
</style>
