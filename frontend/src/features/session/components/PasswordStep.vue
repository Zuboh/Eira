<script setup lang="ts">
import { ref } from 'vue'
import Button from 'primevue/button'
import Password from 'primevue/password'
import type { UtenteTile } from '@/api/reparti'

const password = defineModel<string>('password', { required: true })

defineProps<{
  selectedUtente: UtenteTile | null
  error?: string | null
  success?: string | null
  loading: boolean
}>()

const emit = defineEmits<{
  submit: []
  backToTiles: []
  changeReparto: []
}>()

const passwordInputRef = ref<InstanceType<typeof Password> | null>(null)

function focusPassword() {
  const input = (
    passwordInputRef.value as unknown as { $el?: HTMLElement }
  )?.$el?.querySelector('input') as HTMLInputElement | undefined
  input?.focus()
}

defineExpose({ focusPassword })
</script>

<template>
  <form class="password-step" @submit.prevent="emit('submit')">
    <div class="field">
      <label for="password">Password</label>
      <Password
        ref="passwordInputRef"
        v-model="password"
        input-id="password"
        :feedback="false"
        toggle-mask
        autocomplete="current-password"
        :disabled="loading"
        :aria-invalid="!!error"
        required
      />
    </div>

    <Transition name="error-pop">
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </Transition>

    <Transition name="error-pop">
      <p v-if="success" class="success" role="status">{{ success }}</p>
    </Transition>

    <Button type="submit" label="Accedi" :loading="loading" class="submit" />

    <div class="password-links">
      <button type="button" class="link-btn" @click="emit('backToTiles')">
        Non sei tu?
      </button>
      <button type="button" class="link-btn" @click="emit('changeReparto')">
        Cambia reparto
      </button>
    </div>
  </form>
</template>

<style scoped>
.password-step {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--steel);
}

.field :deep(input) {
  width: 100%;
}

.error {
  color: var(--state-urgente);
  font-size: 0.8125rem;
}

.success {
  color: var(--state-attiva);
  font-size: 0.8125rem;
}

.error-pop-enter-active,
.error-pop-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.error-pop-enter-from,
.error-pop-leave-to {
  opacity: 0;
  transform: translateY(-2px);
}

.submit {
  margin-top: 8px;
  min-height: var(--size-touch);
  font-size: 1rem;
  font-weight: 600;
}

.submit:active {
  transform: scale(0.98);
}

.password-links {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.link-btn {
  background: none;
  border: none;
  padding: 4px 0;
  color: var(--steel);
  font-size: 0.8125rem;
  text-decoration: underline;
  cursor: pointer;
  align-self: flex-start;
  min-height: var(--size-touch);
}

.link-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>
