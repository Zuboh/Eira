<script setup lang="ts">
import Button from 'primevue/button'
defineEmits<{ retry: [] }>()
defineProps<{
  message?: string | null
  retryable?: boolean
}>()
</script>

<template>
  <div v-if="message" class="inline-error">
    <p role="alert">{{ message }}</p>
    <Button
      v-if="retryable"
      label="Riprova"
      severity="secondary"
      outlined
      @click="$emit('retry')"
    />
  </div>
</template>

<style scoped>
.inline-error {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--eira-space-3);
  color: var(--eira-status-danger);
  font-size: 0.8125rem;
  line-height: 1.4;
}
</style>
