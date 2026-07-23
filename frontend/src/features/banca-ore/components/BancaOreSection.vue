<script setup lang="ts">
import Button from 'primevue/button'
import Select from 'primevue/select'
import EiraCard from '@/components/ui/EiraCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import InlineError from '@/components/ui/InlineError.vue'
import type {
  BancaOreSectionEmits,
  BancaOreSectionProps,
} from '@/features/banca-ore/types'
import { formatMeseIt } from '@/utils/dateFormat'

const props = withDefaults(defineProps<BancaOreSectionProps>(), {
  loading: false,
  error: '',
  infermieri: () => [],
  infermiereId: null,
  showInfermiereSelect: false,
})

const emit = defineEmits<BancaOreSectionEmits>()

function saldoLabel() {
  if (!props.bancaOre) return ''
  return props.bancaOre.saldo >= 0
    ? `+${props.bancaOre.saldo}`
    : `${props.bancaOre.saldo}`
}
</script>

<template>
  <EiraCard flush class="banca-ore-section">
    <div class="section-header">
      <div>
        <h2>Banca ore</h2>
        <p>Saldo mensile tra ore effettuate e ore contrattuali.</p>
      </div>
      <div class="controls">
        <Select
          v-if="showInfermiereSelect"
          :modelValue="infermiereId"
          :options="infermieri"
          optionLabel="cognome"
          optionValue="id"
          placeholder="Seleziona infermiere"
          @update:modelValue="emit('update:infermiereId', $event)"
        />
        <div class="mese-picker">
          <Button
            icon="pi pi-chevron-left"
            text
            aria-label="Mese precedente"
            @click="emit('previousMonth')"
          />
          <span>{{ formatMeseIt(mese) }}</span>
          <Button
            icon="pi pi-chevron-right"
            text
            aria-label="Mese successivo"
            @click="emit('nextMonth')"
          />
        </div>
      </div>
    </div>

    <InlineError :message="error" />

    <div v-if="bancaOre" class="ledger">
      <div class="ledger-row">
        <span class="ledger-label">Ore effettuate</span>
        <span class="ledger-value mono">{{ bancaOre.ore_effettuate }}</span>
      </div>
      <div class="ledger-row">
        <span class="ledger-label">Ore contrattuali</span>
        <span class="ledger-value mono">{{ bancaOre.ore_contrattuali }}</span>
      </div>
      <div class="ledger-row" :class="{ negative: bancaOre.saldo < 0 }">
        <span class="ledger-label">Saldo</span>
        <span class="ledger-value mono">{{ saldoLabel() }}</span>
      </div>
    </div>
    <EmptyState
      v-else-if="!loading && !error"
      title="Nessun saldo disponibile"
      message="Seleziona un infermiere e un mese per visualizzare la banca ore."
    />
  </EiraCard>
</template>

<style scoped>
.banca-ore-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.section-header h2 {
  margin: 0;
  font-size: 1.0625rem;
}

.section-header p {
  margin: 4px 0 0;
  color: var(--steel);
  font-size: 0.875rem;
}

.controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.mese-picker {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mese-picker span {
  min-width: 8rem;
  text-align: center;
}

.banca-ore-section {
  container-type: inline-size;
}

.ledger {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.ledger-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
}

.ledger-row + .ledger-row {
  border-top: 1px solid var(--border);
}

.ledger-label {
  font-size: 0.8125rem;
  color: var(--steel);
}

.ledger-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--ink);
}

.ledger-row.negative .ledger-value {
  color: var(--state-urgente);
}

.mono {
  font-family: var(--mono);
}

@media (max-width: 720px) {
  .section-header {
    flex-direction: column;
  }

  .controls {
    justify-content: flex-start;
  }
}
</style>
