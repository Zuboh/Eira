<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import { uploadMyAvatar } from '@/api/auth'
import InlineError from '@/components/ui/InlineError.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import AvatarFilePicker from '@/features/staff/components/AvatarFilePicker.vue'
import { useAuthStore } from '@/stores/auth'

const ROLE_LABEL: Record<string, string> = {
  infermiere: 'Infermiere',
  caposala: 'Caposala',
}

const auth = useAuthStore()

const roleLabel = computed(() =>
  auth.ruolo ? (ROLE_LABEL[auth.ruolo] ?? auth.ruolo) : '',
)

const avatarFile = ref<File | null>(null)
const saving = ref(false)
const error = ref('')
const success = ref(false)

async function salvaAvatar() {
  if (!avatarFile.value) return

  saving.value = true
  error.value = ''
  success.value = false
  try {
    await uploadMyAvatar(avatarFile.value)
    await auth.fetchMe()
    avatarFile.value = null
    success.value = true
  } catch {
    error.value = 'Impossibile aggiornare la foto profilo. Riprova.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="profilo-view">
    <PageHeader title="Il mio profilo" :reparto="auth.repartoNome" />

    <section v-if="auth.user" class="profilo-section">
      <h2 class="profilo-section__title">Dati account</h2>
      <dl class="profilo-fields">
        <div class="profilo-field">
          <dt>Nome</dt>
          <dd>{{ auth.user.nome }}</dd>
        </div>
        <div class="profilo-field">
          <dt>Cognome</dt>
          <dd>{{ auth.user.cognome }}</dd>
        </div>
        <div class="profilo-field">
          <dt>Email</dt>
          <dd>{{ auth.user.email }}</dd>
        </div>
        <div class="profilo-field">
          <dt>Ruolo</dt>
          <dd>{{ roleLabel }}</dd>
        </div>
        <div v-if="auth.repartoNome" class="profilo-field">
          <dt>Reparto</dt>
          <dd>{{ auth.repartoNome }}</dd>
        </div>
      </dl>
    </section>

    <section v-if="auth.user" class="profilo-section">
      <h2 class="profilo-section__title">Foto profilo</h2>
      <div class="profilo-avatar-row">
        <UserAvatar
          :nome="auth.user.nome"
          :cognome="auth.user.cognome"
          :avatar-url="auth.user.avatar_url"
          size="4.5rem"
        />
        <AvatarFilePicker v-model="avatarFile" :disabled="saving" />
      </div>

      <InlineError :message="error" />
      <p v-if="success" class="profilo-success">Foto profilo aggiornata.</p>

      <Button
        label="Salva foto"
        icon="pi pi-check"
        size="small"
        :loading="saving"
        :disabled="!avatarFile || saving"
        @click="salvaAvatar"
      />
    </section>
  </div>
</template>

<style scoped>
.profilo-view {
  padding: var(--page-padding);
  max-width: 960px;
  margin: 0 auto;
}

.profilo-section {
  margin-top: var(--space-6);
}

.profilo-section:first-of-type {
  margin-top: 0;
}

.profilo-section__title {
  margin: 0 0 var(--space-3);
  font-size: 1.125rem;
  font-weight: 600;
}

.profilo-fields {
  display: grid;
  gap: var(--space-3);
  margin: 0;
  border-top: 1px solid var(--border);
}

.profilo-field {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) 0;
  border-top: 1px solid var(--border);
}

.profilo-field:first-child {
  border-top: none;
}

.profilo-field dt {
  color: var(--steel);
  font-size: 0.875rem;
}

.profilo-field dd {
  margin: 0;
  font-weight: 600;
  text-align: right;
}

.profilo-avatar-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.profilo-success {
  margin: 0 0 var(--space-3);
  color: var(--state-attiva-on-tint);
  font-size: 0.8125rem;
}

@media (max-width: 640px) {
  .profilo-field {
    flex-direction: column;
    gap: 2px;
  }

  .profilo-field dd {
    text-align: left;
  }
}
</style>
