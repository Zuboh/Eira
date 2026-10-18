<script setup lang="ts">
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
import FormField from '@/components/ui/FormField.vue'
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
  compact: false,
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
  <EiraCard
    class="banca-ore-section"
    :class="{ 'banca-ore-section--compact': compact }"
  >
    <div class="section-header">
      <div>
        <h2>Banca ore</h2>
        <p v-if="!compact">
          Saldo mensile tra ore effettuate e ore contrattuali.
        </p>
      </div>
      <div class="controls">
        <FormField
          v-if="showInfermiereSelect"
          v-slot="{ fieldAttrs }"
          label="Infermiere"
          for-id="banca-infermiere"
          ><Select
            :pt="{ label: fieldAttrs }"
            input-id="banca-infermiere"
            :modelValue="infermiereId"
            :options="infermieri"
            optionLabel="cognome"
            optionValue="id"
            placeholder="Seleziona infermiere"
            @update:modelValue="emit('update:infermiereId', $event)"
        /></FormField>
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

    <SkeletonBlock v-if="loading" :lines="3" />
    <div v-else-if="bancaOre" class="ledger">
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
  color: var(--eira-text-secondary);
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

/* I text button di PrimeVue si fermano a 38x36: sotto il minimo di tocco */
.mese-picker :deep(.p-button) {
  min-width: var(--eira-size-touch);
  min-height: var(--eira-size-touch);
}

.mese-picker span {
  min-width: 0;
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.banca-ore-section {
  container-type: inline-size;
}

.banca-ore-section--compact .section-header {
  align-items: stretch;
  flex-direction: column;
  gap: var(--eira-space-2);
}

.banca-ore-section--compact .controls,
.banca-ore-section--compact .mese-picker {
  width: 100%;
}

.banca-ore-section--compact .mese-picker {
  justify-content: space-between;
}

.ledger {
  border-block: 1px solid var(--eira-border-default);
}

.ledger-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
}

.ledger-row + .ledger-row {
  border-top: 1px solid var(--eira-border-default);
}

.ledger-label {
  font-size: 0.8125rem;
  color: var(--eira-text-secondary);
}

.ledger-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--eira-text-primary);
}

.ledger-row.negative .ledger-value {
  color: var(--eira-status-danger);
}

.mono {
  font-family: var(--eira-font-sans);
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
