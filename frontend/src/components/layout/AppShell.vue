<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import type { TipoTurno } from '@/api/turni'
import { getMieiProssimiTurni } from '@/api/turni'
import { TIPO_TURNO_LABEL } from '@/features/turni/constants'
import { useAuthStore } from '@/stores/auth'

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
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <RouterLink :to="auth.landingRoute" class="brand">
        <span class="brand-label">Eira</span>
      </RouterLink>

      <nav class="nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.label"
          :to="item.to"
          class="nav-link"
          active-class="active"
          :aria-label="item.label"
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
    </aside>
    <main class="content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100dvh;
  background: var(--canvas);
}

.sidebar {
  position: sticky;
  top: 0;
  width: 13.75rem;
  height: 100dvh;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  border-right: 1px solid var(--border);
  background: var(--canvas);
  padding: var(--space-5) var(--space-3);
}

.brand {
  display: block;
  font-family: var(--sans);
  font-weight: 700;
  font-size: 1.125rem;
  color: var(--ink);
  text-decoration: none;
  padding: var(--space-2) var(--space-3) var(--space-5);
  border-radius: var(--radius-sm);
}

.brand:focus-visible,
.nav-link:focus-visible,
.logout:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
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
  font-size: 0.75rem;
  color: var(--steel);
}

.identity-turno {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 2px 0 0;
  font-size: 0.75rem;
  color: var(--steel);
}

.turno-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--turno-color);
}

.logout {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--size-touch);
  padding: 0 var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--state-urgente) 10%, transparent);
  color: var(--state-urgente-on-tint);
  font-size: 0.875rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}

.logout .nav-link-icon {
  background: var(--surface);
}

.logout:hover {
  background: color-mix(in srgb, var(--state-urgente) 18%, transparent);
}

.logout:active {
  transform: scale(0.98);
}

.content {
  flex: 1;
  min-width: 0;
}

/* Tablet — DESIGN.md sez. 7: sidebar collassabile a icone */
@media (min-width: 48rem) and (max-width: 63.9375rem) {
  .sidebar {
    width: 4rem;
    align-items: center;
    padding: var(--space-5) var(--space-2);
  }

  .brand-label,
  .nav-link-label,
  .logout-label {
    display: none;
  }

  .nav-link,
  .logout {
    justify-content: center;
    padding: 0;
    width: 2.75rem;
  }

  .identity {
    justify-content: center;
    padding: var(--space-2);
  }

  .identity-info {
    display: none;
  }
}

@media (max-width: 48rem) {
  .app-shell {
    flex-direction: column;
  }

  .sidebar {
    position: sticky;
    top: 0;
    z-index: 10;
    width: 100%;
    height: auto;
    flex-direction: row;
    align-items: center;
    gap: var(--space-2);
    overflow-y: visible;
    border-right: 0;
    border-bottom: 1px solid var(--border);
    padding: var(--space-2);
  }

  .brand {
    flex: 0 0 auto;
    padding: 0 var(--space-2);
  }

  .nav {
    min-width: 0;
    flex-direction: row;
    gap: var(--space-1);
    overflow-x: auto;
    scrollbar-width: thin;
  }

  .nav-link {
    flex: 0 0 auto;
    min-height: 2.5rem;
    padding-inline: var(--space-3);
    white-space: nowrap;
  }

  .identity {
    flex: 0 0 auto;
    margin: 0;
    border: none;
    padding: 0 var(--space-2);
  }

  .identity-info {
    display: none;
  }

  .logout {
    flex: 0 0 auto;
    min-height: 2.5rem;
    padding-inline: var(--space-3);
    white-space: nowrap;
  }
}
</style>
