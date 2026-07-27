<script setup lang="ts">
defineProps<{
  nome: string
}>()
</script>

<template>
  <p class="reparto-badge">
    <i class="pi pi-building" aria-hidden="true" />
    <span class="sr-only">Reparto:</span>
    {{ nome }}
  </p>
</template>

<style scoped>
.reparto-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  background: color-mix(in oklch, var(--color-primary) 14%, var(--surface));
  color: var(--color-primary-on-tint);
  font-size: 0.8125rem;
  font-weight: 600;
}

.reparto-badge .pi {
  font-size: 0.875rem;
}
</style>
