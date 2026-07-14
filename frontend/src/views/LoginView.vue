<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import { useAuthStore } from '@/stores/auth'

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const auth = useAuthStore()
const router = useRouter()

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    await router.push({ name: `${auth.ruolo}-dashboard` })
  } catch {
    error.value = 'Credenziali non valide.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-view">
    <form class="login-card" @submit.prevent="onSubmit">
      <h1>Eira</h1>
      <p class="subtitle">Accedi con le tue credenziali di reparto.</p>

      <div class="field">
        <label for="email">Email</label>
        <InputText id="email" v-model="email" type="email" autocomplete="username" required />
      </div>

      <div class="field">
        <label for="password">Password</label>
        <Password
          id="password"
          v-model="password"
          :feedback="false"
          toggle-mask
          autocomplete="current-password"
          required
        />
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <Button type="submit" label="Accedi" :loading="loading" class="submit" />
    </form>
  </div>
</template>

<style scoped>
.login-view {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  background: var(--canvas);
  padding: 16px;
}

.login-card {
  width: 100%;
  max-width: 360px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.subtitle {
  color: var(--steel);
  font-size: 0.9375rem;
  margin-bottom: 8px;
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

.submit {
  margin-top: 8px;
}

.submit:active {
  transform: scale(0.98);
}
</style>
