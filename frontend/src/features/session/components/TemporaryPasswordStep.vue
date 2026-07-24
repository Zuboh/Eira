<script setup lang="ts">
import Button from 'primevue/button'
import Password from 'primevue/password'
import type { UtenteTile } from '@/api/reparti'

const newPassword = defineModel<string>('newPassword', { required: true })
const confirmPassword = defineModel<string>('confirmPassword', {
  required: true,
})

defineProps<{
  selectedUtente: UtenteTile | null
  error?: string | null
  loading: boolean
}>()

const emit = defineEmits<{
  submit: []
  backToTiles: []
  changeReparto: []
}>()
</script>

<template>
  <form class="password-step" @submit.prevent="emit('submit')">
    <div class="field">
      <label for="new-password">Nuova password</label>
      <Password
        id="new-password"
        v-model="newPassword"
        :feedback="false"
        toggle-mask
        autocomplete="new-password"
        :disabled="loading"
        :aria-invalid="!!error"
        required
        minlength="8"
      />
    </div>

    <div class="field">
      <label for="confirm-password">Conferma password</label>
      <Password
        id="confirm-password"
        v-model="confirmPassword"
        :feedback="false"
        toggle-mask
        autocomplete="new-password"
        :disabled="loading"
        :aria-invalid="!!error"
        required
        minlength="8"
      />
    </div>

    <Transition name="error-pop">
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </Transition>

    <Button
      type="submit"
      label="Aggiorna password"
      :loading="loading"
      class="submit"
    />

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
