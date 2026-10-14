<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    flush?: boolean
  }>(),
  {
    title: undefined,
    flush: false,
  },
)
</script>

<template>
  <section class="eira-card" :class="{ 'eira-card--flush': flush }">
    <h2 v-if="title" class="eira-card__title">{{ title }}</h2>
    <slot />
  </section>
</template>

<style scoped>
.eira-card {
  min-width: 0;
  padding: var(--space-5);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow:
    var(--shadow),
    inset 0 1px 0 var(--surface-highlight);
  transition:
    border-color 160ms ease-out,
    box-shadow 160ms ease-out;
}

.eira-card--flush {
  border: none;
  box-shadow: none;
  background: transparent;
}

.eira-card__title {
  margin: 0 0 1rem;
  font-size: 1.0625rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}
</style>
