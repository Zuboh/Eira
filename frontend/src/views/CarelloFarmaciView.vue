<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import EiraCard from '@/components/ui/EiraCard.vue'
import EiraTable from '@/components/ui/EiraTable.vue'
import FormField from '@/components/ui/FormField.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useCarelloFarmaci } from '@/features/carello-farmaci/useCarelloFarmaci'
import { formatDateTimeCompactIt } from '@/utils/dateFormat'

const activeTab = ref<'stock' | 'movimenti'>('stock')
type CarelloTab = typeof activeTab.value
const tabs: CarelloTab[] = ['stock', 'movimenti']

async function selectTab(tab: CarelloTab, focus = false) {
  activeTab.value = tab
  if (focus) {
    await nextTick()
    document.getElementById(`carello-tab-${tab}`)?.focus()
  }
}

function onTabKeydown(event: KeyboardEvent, current: CarelloTab) {
  const index = tabs.indexOf(current)
  let next: CarelloTab | undefined
  if (event.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length]
  else if (event.key === 'ArrowLeft') {
    next = tabs[(index - 1 + tabs.length) % tabs.length]
  } else if (event.key === 'Home') next = tabs[0]
  else if (event.key === 'End') next = tabs[tabs.length - 1]
  if (!next) return
  event.preventDefault()
  void selectTab(next, true)
}

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

    <div class="tabs" role="tablist" aria-label="Carello farmaci">
      <button
        id="carello-tab-stock"
        type="button"
        class="tab"
        role="tab"
        aria-controls="carello-panel-stock"
        :aria-selected="activeTab === 'stock'"
        :tabindex="activeTab === 'stock' ? 0 : -1"
        :class="{ active: activeTab === 'stock' }"
        @click="selectTab('stock')"
        @keydown="onTabKeydown($event, 'stock')"
      >
        Stock
      </button>
      <button
        id="carello-tab-movimenti"
        type="button"
        class="tab"
        role="tab"
        aria-controls="carello-panel-movimenti"
        :aria-selected="activeTab === 'movimenti'"
        :tabindex="activeTab === 'movimenti' ? 0 : -1"
        :class="{ active: activeTab === 'movimenti' }"
        @click="selectTab('movimenti')"
        @keydown="onTabKeydown($event, 'movimenti')"
      >
        Storico movimenti
      </button>
    </div>

    <EiraCard
      v-if="activeTab === 'stock'"
      id="carello-panel-stock"
      flush
      role="tabpanel"
      aria-labelledby="carello-tab-stock"
      tabindex="0"
    >
      <div class="filters">
        <FormField
          v-slot="{ fieldAttrs }"
          label="Cerca farmaco"
          for-id="farmaco-search"
        >
          <InputText
            v-bind="fieldAttrs"
            id="farmaco-search"
            v-model="search"
            placeholder="Nome farmaco"
          />
        </FormField>
        <FormField
          v-slot="{ fieldAttrs }"
          label="Categoria"
          for-id="farmaco-categoria"
        >
          <Select
            v-model="categoria"
            :pt="{ label: fieldAttrs }"
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
        label="Scorte farmaci"
        :error="error"
        retryable
        :empty="farmaciFiltrati.length === 0"
        :empty-message="
          search || categoria
            ? 'Nessun farmaco corrisponde ai filtri. Modifica la ricerca o la categoria.'
            : 'Nessun farmaco nel carello.'
        "
        @retry="load"
      >
        <table style="min-width: var(--eira-table-min-wide)">
          <thead>
            <tr>
              <th>Farmaco</th>
              <th>Categoria</th>
              <th class="numeric">Quantità</th>
              <th class="numeric">Soglia</th>
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
              <td class="numeric">
                <span class="quantity">
                  {{ riga.quantita }}
                  <StatusBadge
                    v-if="isSottoSoglia(riga)"
                    status="urgente"
                    label="Sotto soglia"
                  />
                </span>
              </td>
              <td class="numeric">{{ riga.soglia_minima }}</td>
              <td>
                <div class="stepper" aria-label="Modifica quantità">
                  <Button
                    v-tooltip.top="'Riduci quantità'"
                    icon="pi pi-minus"
                    aria-label="Riduci quantità"
                    size="small"
                    severity="secondary"
                    :disabled="updatingIds.has(riga.id)"
                    @click="adjust(riga, -1)"
                  />
                  <Button
                    v-tooltip.top="'Aumenta quantità'"
                    icon="pi pi-plus"
                    aria-label="Aumenta quantità"
                    severity="secondary"
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

    <EiraCard
      v-else
      id="carello-panel-movimenti"
      flush
      title="Storico movimenti"
      role="tabpanel"
      aria-labelledby="carello-tab-movimenti"
      tabindex="0"
    >
      <EiraTable
        flush
        :loading="movimentiLoading"
        label="Movimenti farmaci"
        :error="movimentiError"
        retryable
        :empty="movimenti.length === 0"
        empty-message="Nessun movimento registrato."
        @retry="loadMovimenti"
      >
        <table style="min-width: var(--eira-table-min-wide)">
          <thead>
            <tr>
              <th>Data</th>
              <th>Farmaco</th>
              <th>Delta</th>
              <th>Nuova quantità</th>
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
              <td>{{ movimento.autore_nome }}</td>
            </tr>
          </tbody>
        </table>
      </EiraTable>
    </EiraCard>
  </div>
</template>

<style scoped>
.carello-view {
  padding: var(--eira-page-padding);
  max-width: var(--eira-page-xl);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tabs,
.filters,
.stepper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quantity {
  display: inline-flex;
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
  border-radius: 0;
  min-height: var(--eira-size-touch);
  padding: 0 16px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: var(--eira-bg-surface);
  color: var(--eira-text-secondary);
  font-weight: 600;
  cursor: pointer;
}

.tab.active {
  background: transparent;
  border-bottom-color: var(--eira-action-primary);
  color: var(--eira-action-selected-text);
}

.unit {
  display: block;
  color: var(--eira-text-secondary);
  font-size: 0.8125rem;
  margin-top: 2px;
}

.stepper {
  justify-content: flex-end;
}
</style>
