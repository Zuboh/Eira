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
  <EiraCard flush title="Priorità operative">
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
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.ledger-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  min-height: var(--size-touch);
  padding: 10px 14px;
}

.ledger-row + .ledger-row {
  border-top: 1px solid var(--border);
}

.ledger-label {
  color: var(--steel);
  font-size: 0.8125rem;
}

.ledger-value {
  color: var(--ink);
  font-size: 1.25rem;
  font-weight: 700;
}

.ledger-row.actionable .ledger-value {
  color: var(--state-urgente);
}

.ledger-link {
  color: inherit;
  text-decoration: none;
}

.ledger-link:hover .ledger-label {
  color: var(--color-primary);
}

.ledger-link:focus-visible {
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.mono {
  font-family: var(--mono);
}
</style>
