<script setup lang="ts">
import { ref, onMounted } from 'vue'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Select from 'primevue/select'
import Button from 'primevue/button'
import { register } from '@/api/auth'
import { listReparti, type Reparto } from '@/api/reparti'

const email = ref('')
const password = ref('')
const nome = ref('')
const cognome = ref('')
const repartoId = ref<number | null>(null)
const reparti = ref<Reparto[]>([])

const error = ref('')
const loading = ref(false)
const submitted = ref(false)

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    await register({
      email: email.value,
      password: password.value,
      nome: nome.value,
      cognome: cognome.value,
      reparto_id: repartoId.value as number,
    })
    submitted.value = true
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 409) {
      error.value = 'Esiste già un account con questa email.'
    } else if (status === 404) {
      error.value = 'Reparto non valido.'
    } else {
      error.value = 'Registrazione non riuscita. Riprova.'
    }
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const { data } = await listReparti()
    reparti.value = data
  } catch {
    error.value = 'Impossibile caricare i reparti.'
  }
})
</script>

<template>
  <div class="register-view">
    <div class="register-card">
      <h1>Eira</h1>

      <template v-if="submitted">
        <p class="subtitle">Registrazione inviata. Attendi l'approvazione di un caposala.</p>
      </template>

      <form v-else class="register-form" @submit.prevent="onSubmit">
        <p class="subtitle">Crea il tuo account.</p>

        <div class="field">
          <label for="nome">Nome</label>
          <InputText id="nome" v-model="nome" autofocus :disabled="loading" required />
        </div>

        <div class="field">
          <label for="cognome">Cognome</label>
          <InputText id="cognome" v-model="cognome" :disabled="loading" required />
        </div>

        <div class="field">
          <label for="email">Email</label>
          <InputText
            id="email"
            v-model="email"
            type="email"
            autocomplete="username"
            :disabled="loading"
            required
          />
        </div>

        <div class="field">
          <label for="password">Password</label>
          <Password
            id="password"
            v-model="password"
            :feedback="false"
            toggle-mask
            autocomplete="new-password"
            :disabled="loading"
            required
          />
        </div>

        <div class="field">
          <label for="reparto">Reparto</label>
          <Select
            id="reparto"
            v-model="repartoId"
            :options="reparti"
            option-label="nome"
            option-value="id"
            placeholder="Seleziona reparto"
            :disabled="loading"
          />
        </div>

        <Transition name="error-pop">
          <p v-if="error" class="error" role="alert">{{ error }}</p>
        </Transition>

        <Button type="submit" label="Registrati" :loading="loading" class="submit" />
      </form>
    </div>
  </div>
</template>

<style scoped>
.register-view {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  background: var(--canvas);
  padding: 16px;
}

.register-card {
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

.register-form {
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

.field :deep(input),
.field :deep(.p-select) {
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
}

.submit:active {
  transform: scale(0.98);
}
</style>
