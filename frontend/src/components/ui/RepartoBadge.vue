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
  gap: var(--eira-space-2);
  color: var(--eira-text-secondary);
  font-size: var(--eira-font-small);
  max-width: 100%;
  overflow-wrap: anywhere;
}
</style>
