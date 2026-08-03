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
        <h1 aria-label="Eira">
          <svg class="auth-wordmark" viewBox="0 0 320 96" aria-hidden="true">
            <g fill="currentColor">
              <path
                d="M18 16h58c5.5 0 10 4.5 10 10s-4.5 10-10 10H40v10h31c5.5 0 10 4.5 10 10s-4.5 10-10 10H40v10h37c5.5 0 10 4.5 10 10s-4.5 10-10 10H18V16z"
              />
              <rect x="104" y="38" width="22" height="48" rx="11" />
              <circle cx="115" cy="24" r="11" />
              <path
                d="M143 49c0-6.1 4.9-11 11-11s11 4.9 11 11v2.8c5.2-9.2 13.5-14.8 24-14.8 6.1 0 11 4.9 11 11s-4.9 11-11 11c-14.2 0-24 8.7-24 24V86h-22V49z"
              />
              <path
                d="M245 37c18.2 0 33 14.8 33 33v16h-21v-6.2c-5.5 5.4-12.7 8.2-21 8.2-16.6 0-30-11.4-30-27s13.4-27 30-27c7.7 0 14.6 2.6 20 7.4V37h-11zm-5 18c-7.7 0-14 5.8-14 13s6.3 13 14 13 14-5.8 14-13-6.3-13-14-13z"
              />
            </g>
          </svg>
        </h1>
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

.auth-header h1 {
  margin: 0;
  display: flex;
  justify-content: center;
  color: var(--color-primary-on-tint);
}

.auth-wordmark {
  height: 2.5rem;
  width: auto;
}

.auth-header h1 + * {
  margin-top: 12px;
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
