<script setup lang="ts">
import { computed } from 'vue'
import type { TipoTurno } from '@/api/turni'
import { TIPO_TURNO_LABEL } from '@/features/turni/constants'
import RepartoBadge from '@/components/ui/RepartoBadge.vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'

const props = defineProps<{
  subtitle?: string | null
  nome?: string | null
  cognome?: string | null
  avatarUrl?: string | null
  turno?: TipoTurno | null
  reparto?: string | null
}>()

const turnoCssVar = computed(() =>
  props.turno ? `var(--turno-${props.turno.replace(/_/g, '-')})` : undefined,
)
const turnoLabel = computed(() =>
  props.turno ? `Turno ${TIPO_TURNO_LABEL[props.turno]}` : '',
)
</script>

<template>
  <main class="auth-view">
    <section class="auth-card" aria-label="Eira">
      <div class="auth-header">
        <RepartoBadge v-if="reparto" :nome="reparto" />
        <div v-if="subtitle" class="auth-identity">
          <UserAvatar
            :nome="nome ?? ''"
            :cognome="cognome ?? ''"
            :avatar-url="avatarUrl"
            size="2.75rem"
          />
          <p class="auth-name">{{ subtitle }}</p>
        </div>
        <p
          v-if="turno"
          class="turno-indicator"
          :style="{ '--turno-color': turnoCssVar }"
        >
          <span class="turno-dot" aria-hidden="true" />
          {{ turnoLabel }}
        </p>
      </div>
      <slot />
    </section>
  </main>
</template>

<style scoped>
.auth-view {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  background: var(--canvas);
  padding: 16px;
}

.auth-card {
  width: 100%;
  max-width: 480px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: clamp(2rem, 5vw, 3rem);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.auth-header {
  text-align: center;
}

.auth-identity {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 12px;
}

.auth-name {
  color: var(--ink);
  font-size: 1.25rem;
  font-weight: 600;
}

.turno-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 6px;
  color: var(--steel);
  font-size: 0.8125rem;
  font-weight: 500;
}

.turno-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--turno-color);
}
</style>
