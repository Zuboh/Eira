<script setup lang="ts">
import { nextTick, ref } from 'vue'
import AuthCard from '@/features/session/components/AuthCard.vue'
import PasswordStep from '@/features/session/components/PasswordStep.vue'
import RepartoStep from '@/features/session/components/RepartoStep.vue'
import TemporaryPasswordStep from '@/features/session/components/TemporaryPasswordStep.vue'
import UserTilesStep from '@/features/session/components/UserTilesStep.vue'
import {
  useLoginFlow,
  type LoginFocusTarget,
} from '@/features/session/useLoginFlow'

const repartoStepRef = ref<InstanceType<typeof RepartoStep> | null>(null)
const userTilesStepRef = ref<InstanceType<typeof UserTilesStep> | null>(null)
const passwordStepRef = ref<InstanceType<typeof PasswordStep> | null>(null)

async function focusFirstOf(el: LoginFocusTarget) {
  await nextTick()
  if (el === 'reparto') repartoStepRef.value?.focusFirst()
  else if (el === 'tile') userTilesStepRef.value?.focusFirst()
  else if (el === 'password') passwordStepRef.value?.focusPassword()
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
  turnoOggi,
  chooseReparto,
  cambiaReparto,
  selectUtente,
  tornaAiTile,
  onSubmit,
  onChangeTemporaryPassword,
} = useLoginFlow({ focusFirstOf })
</script>

<template>
  <AuthCard
    :subtitle="
      selectedUtente ? `${selectedUtente.nome} ${selectedUtente.cognome}` : null
    "
    :turno="turnoOggi"
  >
    <RepartoStep
      v-if="step === 'reparto'"
      ref="repartoStepRef"
      :reparti="reparti"
      :loading="loading"
      :step-error="stepError"
      @choose="chooseReparto"
    />

    <UserTilesStep
      v-else-if="step === 'tiles'"
      ref="userTilesStepRef"
      :utenti="utenti"
      :loading="loading"
      @select="selectUtente"
      @change-reparto="cambiaReparto"
    />

    <PasswordStep
      v-else-if="step === 'password'"
      ref="passwordStepRef"
      v-model:password="password"
      :selected-utente="selectedUtente"
      :error="error"
      :success="success"
      :loading="loading"
      @submit="onSubmit"
      @back-to-tiles="tornaAiTile"
      @change-reparto="cambiaReparto"
    />

    <TemporaryPasswordStep
      v-else
      v-model:new-password="newPassword"
      v-model:confirm-password="confirmPassword"
      :selected-utente="selectedUtente"
      :error="error"
      :loading="loading"
      @submit="onChangeTemporaryPassword"
      @back-to-tiles="tornaAiTile"
      @change-reparto="cambiaReparto"
    />

    <Transition name="error-pop">
      <p v-if="stepError" class="step-error" role="alert">{{ stepError }}</p>
    </Transition>
  </AuthCard>
</template>

<style scoped>
.step-error {
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
</style>
