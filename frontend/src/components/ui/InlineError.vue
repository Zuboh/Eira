<script setup lang="ts">
defineProps<{
  message?: string | null
}>()
</script>

<template>
  <p v-if="message" class="inline-error" role="alert">{{ message }}</p>
</template>

<style scoped>
.inline-error {
  color: var(--state-urgente);
  font-size: 0.8125rem;
  line-height: 1.4;
}
</style>
