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
      v-tooltip.top="linkLabel"
      :to="{ name: routeName }"
      class="see-all hit-area-touch"
      :aria-label="linkLabel"
    >
      {{ linkLabel }}
      <i class="pi pi-arrow-right" aria-hidden="true" />
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

/* L'altezza reale del link e' ~20px: i 44px di tocco arrivano da
   .hit-area-touch (style.css), che gonfia la box senza spostare la
   riga del titolo. */
.see-all {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--steel);
  font-size: 0.8125rem;
  font-weight: 600;
  text-decoration: none;
}

.see-all .pi {
  font-size: 0.75rem;
}
</style>
