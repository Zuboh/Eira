<script setup lang="ts">
import Button from 'primevue/button'
import EiraCard from '@/components/ui/EiraCard.vue'
import EiraTable from '@/components/ui/EiraTable.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import type {
  ParametriVitaliTabEmits,
  ParametriVitaliTabProps,
} from '@/features/patient-chart/types'
import { formatDateTimeCompactIt } from '@/utils/dateFormat'

defineProps<ParametriVitaliTabProps>()

const emit = defineEmits<ParametriVitaliTabEmits>()
</script>

<template>
  <EiraCard flush>
    <div class="panel-header">
      <div>
        <h2 class="title">Parametri vitali</h2>
        <p class="subtitle">
          Ultimo rilevamento e storico recente del paziente.
        </p>
      </div>
      <Button
        v-if="canCreate"
        label="Nuovi parametri"
        size="small"
        @click="emit('newEntry')"
      />
    </div>

    <EmptyState
      v-if="entries.length === 0"
      title="Nessun parametro vitale registrato"
      message="Aggiungi il primo rilevamento del paziente."
    />

    <template v-else>
      <section class="snapshot">
        <h3 class="snapshot__title">Ultimo rilevamento</h3>
        <p class="snapshot__timestamp mono">
          {{ formatDateTimeCompactIt(entries[0].timestamp) }}
        </p>
        <dl class="snapshot__grid">
          <div>
            <dt>T°</dt>
            <dd>{{ entries[0].temperatura.toFixed(1) }} °C</dd>
          </div>
          <div>
            <dt>FC</dt>
            <dd>{{ entries[0].frequenza_cardiaca }}</dd>
          </div>
          <div>
            <dt>PA</dt>
            <dd>
              {{ entries[0].pressione_sistolica }}/{{
                entries[0].pressione_diastolica
              }}
            </dd>
          </div>
          <div>
            <dt>FR</dt>
            <dd>{{ entries[0].frequenza_respiratoria }}</dd>
          </div>
          <div>
            <dt>SpO₂</dt>
            <dd>{{ entries[0].saturazione_o2 }}%</dd>
          </div>
          <div>
            <dt>Coscienza</dt>
            <dd>{{ entries[0].stato_coscienza }}</dd>
          </div>
          <div>
            <dt>O₂</dt>
            <dd>{{ entries[0].ossigeno ? 'Sì' : 'No' }}</dd>
          </div>
        </dl>
        <p v-if="entries[0].note" class="snapshot__note">
          {{ entries[0].note }}
        </p>
      </section>

      <EiraTable
        flush
        :empty="entries.length === 0"
        empty-message="Nessun parametro vitale registrato."
      >
        <table style="min-width: var(--table-min-wide)">
          <thead>
            <tr>
              <th>Data</th>
              <th>T°</th>
              <th>FC</th>
              <th>PA</th>
              <th>FR</th>
              <th>SpO₂</th>
              <th>Coscienza</th>
              <th>O₂</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in entries" :key="entry.id">
              <td class="mono">
                {{ formatDateTimeCompactIt(entry.timestamp) }}
              </td>
              <td>{{ entry.temperatura.toFixed(1) }} °C</td>
              <td>{{ entry.frequenza_cardiaca }}</td>
              <td>
                {{ entry.pressione_sistolica }}/{{ entry.pressione_diastolica }}
              </td>
              <td>{{ entry.frequenza_respiratoria }}</td>
              <td>{{ entry.saturazione_o2 }}%</td>
              <td>{{ entry.stato_coscienza }}</td>
              <td>{{ entry.ossigeno ? 'Sì' : 'No' }}</td>
              <td>{{ entry.note || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </EiraTable>
    </template>
  </EiraCard>
</template>

<style scoped>
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 16px;
}

.title {
  margin: 0;
  font-size: 1.0625rem;
}

.subtitle {
  margin: 4px 0 0;
  color: var(--steel);
  font-size: 0.875rem;
}

.snapshot {
  margin-bottom: 16px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: color-mix(in srgb, var(--surface) 88%, var(--color-primary));
}

.snapshot__title {
  margin: 0 0 4px;
  font-size: 0.95rem;
}

.snapshot__timestamp {
  margin: 0 0 12px;
  color: var(--steel);
  font-size: 0.8125rem;
}

.snapshot__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}

.snapshot__grid dt {
  color: var(--steel);
  font-size: 0.75rem;
}

.snapshot__grid dd {
  margin: 4px 0 0;
  font-weight: 600;
}

.snapshot__note {
  margin: 12px 0 0;
}

.mono {
  font-family: var(--mono);
}

@media (max-width: 900px) {
  .snapshot__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .panel-header {
    flex-direction: column;
  }

  .snapshot__grid {
    grid-template-columns: 1fr;
  }
}
</style>
