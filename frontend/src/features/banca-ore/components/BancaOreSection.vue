<script setup lang="ts">
import Button from 'primevue/button'
import Select from 'primevue/select'
import EiraCard from '@/components/ui/EiraCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import InlineError from '@/components/ui/InlineError.vue'
import type { BancaOreSectionEmits, BancaOreSectionProps } from '@/features/banca-ore/types'

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
  return props.bancaOre.saldo >= 0 ? `+${props.bancaOre.saldo}` : `${props.bancaOre.saldo}`
}
</script>

<template>
  <section class="banca-ore-section">
    <div class="section-header">
      <div>
        <h2>Banca ore</h2>
        <p>Saldo mensile tra ore pianificate e ore contrattuali.</p>
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
          <Button icon="pi pi-chevron-left" text aria-label="Mese precedente" @click="emit('previousMonth')" />
          <span class="mono">{{ mese }}</span>
          <Button icon="pi pi-chevron-right" text aria-label="Mese successivo" @click="emit('nextMonth')" />
        </div>
      </div>
    </div>

    <InlineError :message="error" />

    <div v-if="bancaOre" class="tiles">
      <EiraCard class="tile">
        <span class="tile-label">Ore pianificate</span>
        <span class="tile-value mono">{{ bancaOre.ore_pianificate }}</span>
      </EiraCard>
      <EiraCard class="tile">
        <span class="tile-label">Ore contrattuali</span>
        <span class="tile-value mono">{{ bancaOre.ore_contrattuali }}</span>
      </EiraCard>
      <EiraCard class="tile" :class="{ negative: bancaOre.saldo < 0, positive: bancaOre.saldo >= 0 }">
        <span class="tile-label">Saldo</span>
        <span class="tile-value mono">{{ saldoLabel() }}</span>
      </EiraCard>
    </div>
    <EmptyState
      v-else-if="!loading && !error"
      title="Nessun saldo disponibile"
      message="Seleziona un infermiere e un mese per visualizzare la banca ore."
    />
  </section>
</template>

<style scoped>
.banca-ore-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-header {
  display: flex;
  align-items: flex-start;
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

.tiles {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.tile {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tile-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--steel);
}

.tile-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ink);
}

.tile.positive .tile-value {
  color: var(--state-attiva);
}

.tile.negative .tile-value {
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

  .tiles {
    grid-template-columns: 1fr;
  }
}
</style>
