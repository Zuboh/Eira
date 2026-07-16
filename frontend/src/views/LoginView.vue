<script setup lang="ts">
import { nextTick, ref } from 'vue'
import Password from 'primevue/password'
import Button from 'primevue/button'
import {
  useLoginFlow,
  type LoginFocusTarget,
} from '@/features/session/useLoginFlow'

const firstRepartoBtn = ref<HTMLButtonElement | null>(null)
const firstTileBtn = ref<HTMLButtonElement | null>(null)
const passwordInputRef = ref<InstanceType<typeof Password> | null>(null)

async function focusFirstOf(el: LoginFocusTarget) {
  await nextTick()
  if (el === 'reparto') firstRepartoBtn.value?.focus()
  else if (el === 'tile') firstTileBtn.value?.focus()
  else if (el === 'password') {
    const input = (passwordInputRef.value as unknown as { $el?: HTMLElement })?.$el?.querySelector(
      'input',
    ) as HTMLInputElement | undefined
    input?.focus()
  }
}

const {
  step,
  reparti,
  utenti,
  selectedUtente,
  password,
  newPassword,
  confirmPassword,
  error,
  success,
  loading,
  stepError,
  chooseReparto,
  cambiaReparto,
  selectUtente,
  tornaAiTile,
  onSubmit,
  onChangeTemporaryPassword,
} = useLoginFlow({ focusFirstOf })
</script>

<template>
  <div class="login-view">
    <div class="login-card">
      <h1>Eira</h1>

      <!-- Step A: device reparto setup -->
      <template v-if="step === 'reparto'">
        <p class="subtitle">Seleziona il reparto di questo dispositivo.</p>
        <ul class="reparto-list">
          <li v-for="(reparto, i) in reparti" :key="reparto.id">
            <button
              type="button"
              class="reparto-item"
              :ref="i === 0 ? (el) => (firstRepartoBtn = el as HTMLButtonElement) : undefined"
              :disabled="loading"
              @click="chooseReparto(reparto)"
            >
              {{ reparto.nome }}
            </button>
          </li>
        </ul>
        <p v-if="!loading && reparti.length === 0 && !stepError" class="hint">
          Nessun reparto disponibile.
        </p>
      </template>

      <!-- Step B: tile grid -->
      <template v-else-if="step === 'tiles'">
        <p class="subtitle">Seleziona il tuo nome.</p>
        <template v-if="utenti.length > 0">
          <div class="tile-grid">
            <button
              v-for="(utente, i) in utenti"
              :key="utente.id"
              type="button"
              class="tile"
              :ref="i === 0 ? (el) => (firstTileBtn = el as HTMLButtonElement) : undefined"
              :disabled="loading"
              @click="selectUtente(utente)"
            >
              {{ utente.nome }} {{ utente.cognome }}
            </button>
          </div>
        </template>
        <p v-else class="hint">Nessun utente in questo reparto.</p>
        <button type="button" class="link-btn" @click="cambiaReparto">Cambia reparto</button>
      </template>

      <!-- Step C: password -->
      <form v-else-if="step === 'password'" class="password-step" @submit.prevent="onSubmit">
        <p class="subtitle">{{ selectedUtente?.nome }} {{ selectedUtente?.cognome }}</p>

        <div class="field">
          <label for="password">Password</label>
          <Password
            id="password"
            ref="passwordInputRef"
            v-model="password"
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
          <button type="button" class="link-btn" @click="tornaAiTile">Non sei tu?</button>
          <button type="button" class="link-btn" @click="cambiaReparto">Cambia reparto</button>
        </div>
      </form>

      <form v-else class="password-step" @submit.prevent="onChangeTemporaryPassword">
        <p class="subtitle">{{ selectedUtente?.nome }} {{ selectedUtente?.cognome }}</p>

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

        <Button type="submit" label="Aggiorna password" :loading="loading" class="submit" />

        <div class="password-links">
          <button type="button" class="link-btn" @click="tornaAiTile">Non sei tu?</button>
          <button type="button" class="link-btn" @click="cambiaReparto">Cambia reparto</button>
        </div>
      </form>

      <Transition name="error-pop">
        <p v-if="stepError" class="error" role="alert">{{ stepError }}</p>
      </Transition>
    </div>
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
  max-width: 420px;
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

.hint {
  color: var(--steel);
  font-size: 0.875rem;
}

.reparto-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reparto-item {
  width: 100%;
  min-height: 44px;
  text-align: left;
  padding: 12px 16px;
  background: var(--canvas);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 0.9375rem;
  cursor: pointer;
  transition:
    background 0.15s ease,
    transform 0.15s ease;
}

.reparto-item:hover {
  background: var(--surface);
}

.reparto-item:active {
  transform: scale(0.98);
}

.tile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}

.tile {
  min-height: 44px;
  padding: 16px 12px;
  background: var(--canvas);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 0.9375rem;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
  transition:
    background 0.15s ease,
    transform 0.15s ease;
}

.tile:hover {
  background: var(--surface);
}

.tile:active {
  transform: scale(0.98);
}

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
  min-height: 44px;
}
</style>
