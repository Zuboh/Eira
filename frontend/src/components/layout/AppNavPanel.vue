<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import type { TipoTurno } from '@/api/turni'
import { getMieiProssimiTurni } from '@/api/turni'
import { TIPO_TURNO_LABEL } from '@/features/turni/constants'
import { useAuthStore } from '@/stores/auth'

const emit = defineEmits<{ navigate: [] }>()

const auth = useAuthStore()
const router = useRouter()

const navItems = computed(() => {
  if (!auth.ruolo) return []

  return router
    .getRoutes()
    .filter(
      (route) =>
        route.name && route.meta.nav && route.meta.roles?.includes(auth.ruolo!),
    )
    .sort((a, b) => a.meta.nav!.order - b.meta.nav!.order)
    .map((route) => ({
      to: { name: route.name! },
      label: route.meta.nav!.label,
      icon: route.meta.nav!.icon,
    }))
})

const ROLE_LABEL: Record<string, string> = {
  infermiere: 'Infermiere',
  caposala: 'Caposala',
}

const initials = computed(() => {
  const user = auth.user
  if (!user) return ''
  return `${user.nome.charAt(0)}${user.cognome.charAt(0)}`.toUpperCase()
})

const roleLabel = computed(() =>
  auth.ruolo ? (ROLE_LABEL[auth.ruolo] ?? auth.ruolo) : '',
)

const turnoOggi = ref<TipoTurno | null>(null)

const turnoCssVar = computed(() =>
  turnoOggi.value
    ? `var(--turno-${turnoOggi.value.replace(/_/g, '-')})`
    : undefined,
)
const turnoLabel = computed(() =>
  turnoOggi.value ? TIPO_TURNO_LABEL[turnoOggi.value] : '',
)

function todayIso(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

onMounted(async () => {
  if (auth.ruolo !== 'infermiere') return

  try {
    const { data } = await getMieiProssimiTurni({ limit: 1 })
    const primo = data[0]
    turnoOggi.value =
      primo && primo.turno.data === todayIso() ? primo.turno.tipo : null
  } catch {
    turnoOggi.value = null
  }
})

function logout() {
  auth.logout()
  emit('navigate')
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="nav-panel">
    <nav class="nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.label"
        :to="item.to"
        class="nav-link"
        active-class="active"
        :aria-label="item.label"
        @click="emit('navigate')"
      >
        <span class="nav-link-icon">
          <i class="pi" :class="item.icon" aria-hidden="true" />
        </span>
        <span class="nav-link-label">{{ item.label }}</span>
      </RouterLink>
    </nav>

    <div
      v-if="auth.user"
      class="identity"
      :title="`${auth.user.nome} ${auth.user.cognome} — ${roleLabel}`"
    >
      <span class="identity-avatar" aria-hidden="true">{{ initials }}</span>
      <div class="identity-info">
        <p class="identity-name">
          {{ auth.user.nome }} {{ auth.user.cognome }}
        </p>
        <p class="identity-role">{{ roleLabel }}</p>
        <p v-if="turnoOggi" class="identity-turno">
          <span
            class="turno-dot"
            aria-hidden="true"
            :style="{ '--turno-color': turnoCssVar }"
          />
          {{ turnoLabel }}
        </p>
      </div>
    </div>

    <button
      type="button"
      class="logout"
      aria-label="Esci"
      title="Esci"
      @click="logout"
    >
      <span class="nav-link-icon">
        <i class="pi pi-sign-out" aria-hidden="true" />
      </span>
      <span class="logout-label">Esci</span>
    </button>
  </div>
</template>

<style scoped>
.nav-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex: 1;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--size-touch);
  padding: 0 var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--steel);
  text-decoration: none;
  font-size: 0.9375rem;
  font-weight: 500;
  transition:
    background 150ms ease-out,
    box-shadow 150ms ease-out,
    border-color 150ms ease-out;
}

.nav-link:focus-visible,
.logout:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.nav-link-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 1.75rem;
  height: 1.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
}

.nav-link-icon i {
  font-size: 0.875rem;
}

.nav-link:hover {
  background: var(--surface);
  color: var(--color-primary);
}

.nav-link.active {
  background: var(--surface);
  border-color: var(--border);
  box-shadow: var(--shadow);
  color: var(--ink);
  font-weight: 600;
}

.identity {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  margin-top: var(--space-2);
  margin-bottom: var(--space-4);
  border-top: 1px solid var(--border);
}

.identity-avatar {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  background: color-mix(in oklch, var(--color-primary) 14%, var(--surface));
  color: var(--color-primary-on-tint);
  font-size: 0.8125rem;
  font-weight: 700;
}

.identity-info {
  min-width: 0;
}

.identity-name {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.identity-role {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--steel);
}

.identity-turno {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 2px 0 0;
  font-size: 0.8125rem;
  color: var(--steel);
}

.turno-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--turno-color);
}

/* A riposo identico a .nav-link: il rosso e' un avviso, e tenerlo acceso
   di continuo su una voce che non e' un errore lo spegne come segnale. */
.logout {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--size-touch);
  padding: 0 var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--steel);
  font-size: 0.9375rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition:
    background 150ms ease-out,
    box-shadow 150ms ease-out,
    border-color 150ms ease-out;
}

/* Dove .nav-link vira su --color-primary, qui si vira sul rosso: stesso
   gesto, colore diverso perche' l'azione lo e'. */
.logout:hover {
  background: color-mix(in srgb, var(--state-urgente) 18%, transparent);
  color: var(--state-urgente-on-tint);
}

.logout:active {
  transform: scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .nav-link {
    transition: none;
  }

  .logout:active {
    transform: none;
  }
}

/* Tablet — DESIGN.md sez. 7: sidebar collassabile a icone.
   Non si applica dentro il Drawer, che vive sotto i 768px. */
@media (min-width: 48rem) and (max-width: 63.9375rem) {
  .nav-link-label,
  .logout-label {
    display: none;
  }

  .nav-link,
  .logout {
    justify-content: center;
    padding: 0;
    /* non 2.75rem: con root a 15px valeva 41px, sotto il minimo di tocco */
    width: var(--size-touch);
  }

  .identity {
    justify-content: center;
    /* padding orizzontale inutile senza label, e con l'avatar a
       flex-shrink: 0 spingeva il contenuto oltre il rail: la sidebar
       si ritrovava overflow-x auto e una scrollbar orizzontale. */
    padding: var(--space-2) 0;
  }

  .identity-info {
    display: none;
  }
}
</style>
