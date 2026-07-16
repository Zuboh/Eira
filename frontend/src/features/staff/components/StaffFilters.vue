<script setup lang="ts">
import type { StatoUtente } from '@/api/utenti'
import type { StaffFiltersProps } from '@/features/staff/types'

const filter = defineModel<StatoUtente>({ required: true })

defineProps<StaffFiltersProps>()
</script>

<template>
  <div class="filtri">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="chip"
      :class="{ active: filter === option.value }"
      @click="filter = option.value"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.filtri {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0;
}

.chip {
  padding: 6px 14px;
  min-height: var(--size-touch);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--steel);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
}

.chip.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-on-primary);
}
</style>
