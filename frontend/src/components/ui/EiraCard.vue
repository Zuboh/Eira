<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <section class="eira-card">
    <h2 v-if="title" class="eira-card__title">{{ title }}</h2>
    <slot />
  </section>
</template>

<style scoped>
.eira-card {
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow);
}

.eira-card__title {
  margin: 0 0 12px;
  font-size: 1.0625rem;
}
</style>
