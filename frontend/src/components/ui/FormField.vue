<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{
  label: string
  forId: string
  help?: string | null
  error?: string | null
  required?: boolean
}>()
const fieldAttrs = computed(() => ({
  'aria-labelledby': `${props.forId}-label`,
  'aria-describedby': props.error
    ? `${props.forId}-error`
    : props.help
      ? `${props.forId}-help`
      : undefined,
  'aria-invalid': props.error ? true : undefined,
  'aria-required': props.required || undefined,
}))
</script>

<template>
  <div class="form-field">
    <label :id="`${forId}-label`" class="form-field__label" :for="forId">
      {{ label }}
      <span v-if="required" aria-hidden="true">*</span>
    </label>
    <slot :field-attrs="fieldAttrs" />
    <p
      v-if="error"
      :id="`${forId}-error`"
      class="form-field__error"
      role="alert"
    >
      {{ error }}
    </p>
    <p v-else-if="help" :id="`${forId}-help`" class="form-field__help">
      {{ help }}
    </p>
  </div>
</template>

<style scoped>
.form-field {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--eira-space-2);
}

.form-field__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--eira-text-primary);
}

.form-field__error {
  margin: 0;
  color: var(--eira-status-danger);
  font-size: 0.8125rem;
  line-height: 1.4;
}

.form-field__help {
  margin: 0;
  color: var(--eira-text-secondary);
  font-size: 0.8125rem;
  line-height: 1.4;
}
</style>
