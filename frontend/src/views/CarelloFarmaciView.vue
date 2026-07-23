<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import EiraCard from '@/components/ui/EiraCard.vue'
import EiraTable from '@/components/ui/EiraTable.vue'
import FormField from '@/components/ui/FormField.vue'
import InlineError from '@/components/ui/InlineError.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useCarelloFarmaci } from '@/features/carello-farmaci/useCarelloFarmaci'
import { formatDateTimeCompactIt } from '@/utils/dateFormat'

const activeTab = ref<'stock' | 'movimenti'>('stock')

const {
  movimenti,
  search,
  categoria,
  categorie,
  farmaciFiltrati,
  loading,
  movimentiLoading,
  updatingIds,
  error,
  movimentiError,
  isSottoSoglia,
  load,
  loadMovimenti,
  adjust,
} = useCarelloFarmaci()

onMounted(async () => {
  await Promise.all([load(), loadMovimenti()])
})
</script>

<template>
  <div class="carello-view">
    <PageHeader title="Carello Farmaci" />

    <InlineError :message="error || movimentiError" />

    <div class="tabs" role="tablist" aria-label="Carello farmaci">
      <button
        type="button"
        class="tab"
        :class="{ active: activeTab === 'stock' }"
        @click="activeTab = 'stock'"
      >
        Stock
      </button>
      <button
        type="button"
        class="tab"
        :class="{ active: activeTab === 'movimenti' }"
        @click="activeTab = 'movimenti'"
      >
        Storico movimenti
      </button>
    </div>

    <EiraCard v-if="activeTab === 'stock'" flush>
      <div class="filters">
        <FormField label="Cerca farmaco" for-id="farmaco-search">
          <InputText
            id="farmaco-search"
            v-model="search"
            placeholder="Nome farmaco"
          />
        </FormField>
        <FormField label="Categoria" for-id="farmaco-categoria">
          <Select
            v-model="categoria"
            input-id="farmaco-categoria"
            :options="categorie"
            placeholder="Tutte"
            show-clear
          />
        </FormField>
      </div>

      <EiraTable
        flush
        :loading="loading"
        :empty="farmaciFiltrati.length === 0"
        empty-message="Nessun farmaco nel carello."
      >
        <table style="min-width: var(--table-min-wide)">
          <thead>
            <tr>
              <th>Farmaco</th>
              <th>Categoria</th>
              <th>Quantità</th>
              <th>Soglia</th>
              <th><span class="sr-only">Azioni</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="riga in farmaciFiltrati" :key="riga.id">
              <td>
                <strong>{{ riga.farmaco.nome }}</strong>
                <span class="unit">{{ riga.farmaco.unita_misura }}</span>
              </td>
              <td>{{ riga.farmaco.categoria }}</td>
              <td class="quantity">
                {{ riga.quantita }}
                <StatusBadge
                  v-if="isSottoSoglia(riga)"
                  status="urgente"
                  label="Sotto soglia"
                />
              </td>
              <td>{{ riga.soglia_minima }}</td>
              <td>
                <div class="stepper" aria-label="Modifica quantità">
                  <Button
                    icon="pi pi-minus"
                    aria-label="Riduci quantità"
                    size="small"
                    severity="secondary"
                    :disabled="updatingIds.has(riga.id)"
                    @click="adjust(riga, -1)"
                  />
                  <Button
                    icon="pi pi-plus"
                    aria-label="Aumenta quantità"
                    size="small"
                    :disabled="updatingIds.has(riga.id)"
                    @click="adjust(riga, 1)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </EiraTable>
    </EiraCard>

    <EiraCard v-else flush title="Storico movimenti">
      <EiraTable
        flush
        :loading="movimentiLoading"
        :empty="movimenti.length === 0"
        empty-message="Nessun movimento registrato."
      >
        <table style="min-width: var(--table-min-wide)">
          <thead>
            <tr>
              <th>Data</th>
              <th>Farmaco</th>
              <th>Delta</th>
              <th>Quantità dopo</th>
              <th>Autore</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="movimento in movimenti" :key="movimento.id">
              <td class="mono">
                {{ formatDateTimeCompactIt(movimento.timestamp) }}
              </td>
              <td>{{ movimento.farmaco_nome }}</td>
              <td class="mono">
                {{ movimento.delta > 0 ? '+' : '' }}{{ movimento.delta }}
              </td>
              <td>{{ movimento.quantita_dopo }}</td>
              <td>#{{ movimento.autore_id }}</td>
            </tr>
          </tbody>
        </table>
      </EiraTable>
    </EiraCard>
  </div>
</template>

<style scoped>
.carello-view {
  padding: var(--page-padding);
  max-width: var(--page-xl);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tabs,
.filters,
.stepper,
.quantity {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filters {
  align-items: end;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.filters > * {
  min-width: 14rem;
}

.tab {
  min-height: var(--size-touch);
  padding: 0 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--steel);
  font-weight: 600;
  cursor: pointer;
}

.tab.active {
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  color: var(--color-primary-on-tint);
}

.unit {
  display: block;
  color: var(--steel);
  font-size: 0.8125rem;
  margin-top: 2px;
}

.stepper {
  justify-content: flex-end;
}
</style>
