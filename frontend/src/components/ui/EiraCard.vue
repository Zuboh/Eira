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
  padding-block: var(--eira-space-5);
  border-block-start: 1px solid var(--eira-border-default);
}
.eira-card--flush {
  border: 0;
  padding: 0;
}
.eira-card__title {
  margin-bottom: var(--eira-space-4);
  font-size: 1rem;
  font-weight: 600;
}
</style>
