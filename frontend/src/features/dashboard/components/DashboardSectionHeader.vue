<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{
  title: string
  linkLabel?: string
  routeName?: string
}>()
</script>

<template>
  <div class="section-header">
    <h2>{{ title }}</h2>
    <RouterLink
      v-if="routeName && linkLabel"
      :to="{ name: routeName }"
      class="see-all"
    >
      {{ linkLabel }}
    </RouterLink>
  </div>
</template>

<style scoped>
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.section-header h2 {
  margin: 0;
  font-size: 1.0625rem;
}

.see-all {
  color: var(--steel);
  font-size: 0.8125rem;
  font-weight: 600;
  text-decoration: none;
}
</style>
