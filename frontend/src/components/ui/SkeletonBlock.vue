<script setup lang="ts">
withDefaults(defineProps<{ lines?: number; ariaLabel?: string }>(), {
  lines: 3,
  ariaLabel: 'Caricamento in corso',
})
</script>

<template>
  <div
    class="skeleton-block"
    role="status"
    aria-live="polite"
    :aria-label="ariaLabel"
  >
    <span v-for="n in lines" :key="n" class="skeleton-block__bar" />
  </div>
</template>

<style scoped>
.skeleton-block {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-block__bar {
  height: 0.875rem;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--steel) 16%, var(--surface));
}

.skeleton-block__bar:nth-child(odd) {
  width: 70%;
}

.skeleton-block__bar:nth-child(even) {
  width: 45%;
}
</style>
