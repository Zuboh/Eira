<script setup lang="ts">
import RepartoBadge from '@/components/ui/RepartoBadge.vue'

defineProps<{
  title: string
  subtitle?: string
  reparto?: string | null
}>()
</script>

<template>
  <header class="page-header">
    <div class="page-header__copy">
      <h1 class="page-header__title">{{ title }}</h1>
      <RepartoBadge
        v-if="reparto"
        class="page-header__reparto"
        :nome="reparto"
      />
      <p v-if="subtitle" class="page-header__subtitle">{{ subtitle }}</p>
    </div>

    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
  padding-bottom: 1.125rem;
  border-bottom: 1px solid var(--border);
}

.page-header__copy {
  min-width: 0;
}

.page-header__title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: clamp(1.75rem, 2vw, 2rem);
  font-weight: 750;
  letter-spacing: -0.045em;
}

.page-header__reparto {
  margin-top: 6px;
}

.page-header__subtitle {
  margin-top: 8px;
  color: var(--steel);
  font-size: 0.9375rem;
}

.page-header__actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .page-header__actions {
    justify-content: flex-start;
  }
}
</style>
