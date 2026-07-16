<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { DashboardInfermiereQuickLink } from '@/features/dashboard/types'

const links: DashboardInfermiereQuickLink[] = [
  { label: 'Pazienti', routeName: 'pazienti' },
  { label: 'Consegne SBAR', routeName: 'consegne-sbar' },
  { label: 'Cambio turno', routeName: 'cambio-turno' },
]
</script>

<template>
  <div class="quick-links">
    <RouterLink v-for="link in links" :key="link.routeName" :to="{ name: link.routeName }" class="quick-link">
      {{ link.label }}
    </RouterLink>
  </div>
</template>

<style scoped>
.quick-links {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.quick-link {
  padding: 8px 16px;
  min-height: var(--size-touch);
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: inherit;
  text-decoration: none;
  font-size: 0.9375rem;
}
</style>
