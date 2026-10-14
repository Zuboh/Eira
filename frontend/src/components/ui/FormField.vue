<script setup lang="ts">
defineProps<{
  label: string
  forId: string
  help?: string | null
  error?: string | null
  required?: boolean
}>()
</script>

<template>
  <div class="form-field">
    <label class="form-field__label" :for="forId">
      {{ label }}
      <span v-if="required" aria-hidden="true">*</span>
    </label>
    <slot />
    <p v-if="error" class="form-field__error" role="alert">{{ error }}</p>
    <p v-else-if="help" class="form-field__help">{{ help }}</p>
  </div>
</template>

<style scoped>
.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-field__label {
  font-size: 0.875rem;
  font-weight: 650;
  color: var(--ink);
}

.form-field__error {
  margin: 0;
  color: var(--state-urgente);
  font-size: 0.8125rem;
  line-height: 1.4;
}

.form-field__help {
  margin: 0;
  color: var(--steel);
  font-size: 0.8125rem;
  line-height: 1.4;
}
</style>
