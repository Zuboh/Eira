<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import type { TipoTurno } from '@/api/turni'
import { getMieiProssimiTurni } from '@/api/turni'
import UserAvatar from '@/components/ui/UserAvatar.vue'
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
      group: route.meta.nav!.group,
      path: route.path,
    }))
})

const navGroups = computed(() =>
  [
    { key: 'panoramica', label: 'Panoramica' },
    { key: 'assistenza', label: 'Assistenza' },
    { key: 'organizzazione', label: 'Organizzazione' },
  ]
    .map((group) => ({
      ...group,
      items: navItems.value.filter((item) => item.group === group.key),
    }))
    .filter((group) => group.items.length),
)

const ROLE_LABEL: Record<string, string> = {
  infermiere: 'Infermiere',
  caposala: 'Caposala',
}

const roleLabel = computed(() =>
  auth.ruolo ? (ROLE_LABEL[auth.ruolo] ?? auth.ruolo) : '',
)

const turnoOggi = ref<TipoTurno | null>(null)

const turnoCssVar = computed(() =>
  turnoOggi.value
    ? `var(--eira-shift-${turnoOggi.value.replace(/_/g, '-')})`
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
    <nav class="nav" aria-label="Navigazione principale">
      <div v-for="group in navGroups" :key="group.key" class="nav-group">
        <p v-if="group.key !== 'panoramica'" class="nav-group-label">
          {{ group.label }}
        </p>
        <RouterLink
          v-for="item in group.items"
          :key="item.path"
          :to="item.to"
          class="nav-link"
          active-class="active"
          :aria-label="item.label"
          :title="item.label"
          :class="{
            active:
              item.path === '/pazienti' &&
              router.currentRoute.value.path.startsWith('/pazienti/'),
          }"
          @click="emit('navigate')"
        >
          <i class="pi nav-link-icon" :class="item.icon" aria-hidden="true" />
          <span class="nav-link-label">{{ item.label }}</span>
        </RouterLink>
      </div>
    </nav>

    <RouterLink
      v-if="auth.user"
      :to="{ name: 'profilo' }"
      class="identity"
      :title="`${auth.user.nome} ${auth.user.cognome} — ${roleLabel}${auth.repartoNome ? ` — ${auth.repartoNome}` : ''}`"
      @click="emit('navigate')"
    >
      <div class="identity-person">
        <UserAvatar
          :nome="auth.user.nome"
          :cognome="auth.user.cognome"
          :avatar-url="auth.user.avatar_url"
          size="2.25rem"
        />
        <div class="identity-info">
          <p class="identity-name">{{ auth.user.nome }}</p>
          <p class="identity-role">{{ roleLabel }}</p>
        </div>
      </div>

      <div class="identity-details">
        <p v-if="auth.repartoNome" class="identity-detail">
          <i class="pi pi-building" aria-hidden="true" />
          <span class="sr-only">Reparto:</span>
          <span class="identity-reparto-name">{{ auth.repartoNome }}</span>
        </p>
        <p v-if="turnoOggi" class="identity-detail">
          <span
            class="turno-dot"
            aria-hidden="true"
            :style="{ '--eira-shift-color': turnoCssVar }"
          />
          {{ turnoLabel }}
        </p>
      </div>
    </RouterLink>

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
  min-width: 0;
  min-height: 0;
}
.nav {
  display: flex;
  flex-direction: column;
  gap: var(--eira-space-5);
  flex: 1;
}
.nav-group {
  min-width: 0;
}
.nav-group-label {
  color: var(--eira-text-secondary);
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0 var(--eira-space-3) var(--eira-space-1);
}
.nav-link,
.logout {
  display: flex;
  align-items: center;
  gap: var(--eira-space-3);
  min-height: var(--eira-size-touch);
  padding: var(--eira-space-2) var(--eira-space-3);
  border: 0;
  border-radius: var(--eira-radius-sm);
  color: var(--eira-text-secondary);
  background: transparent;
  text-decoration: none;
  font-size: var(--eira-font-body);
  font-weight: 400;
  text-align: left;
  cursor: pointer;
  transition: background var(--eira-motion-duration) var(--eira-motion-easing);
}
.nav-link-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 16px;
  font-size: 1rem;
}
.nav-link:hover,
.logout:hover,
.identity:hover {
  background: var(--eira-bg-hover);
  color: var(--eira-text-primary);
}
.nav-link.active {
  background: var(--eira-action-selected-background);
  color: var(--eira-action-selected-text);
  font-weight: 500;
}
.identity {
  display: flex;
  flex-direction: column;
  gap: var(--eira-space-2);
  margin-top: var(--eira-space-6);
  padding: var(--eira-space-3);
  border-top: 1px solid var(--eira-border-default);
  color: inherit;
  text-decoration: none;
}
.identity-person {
  display: flex;
  align-items: center;
  gap: var(--eira-space-2);
  min-width: 0;
}
.identity-info,
.identity-details {
  min-width: 0;
}
.identity-name {
  font-size: var(--eira-font-body);
  font-weight: 500;
  overflow-wrap: anywhere;
}
.identity-role,
.identity-detail {
  color: var(--eira-text-secondary);
  font-size: var(--eira-font-small);
}
.identity-detail {
  display: flex;
  align-items: center;
  gap: var(--eira-space-2);
  margin-top: var(--eira-space-1);
}
.identity-reparto-name {
  overflow-wrap: anywhere;
}
.turno-dot {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--eira-shift-color);
}
@media (min-width: 48rem) and (max-width: 63.9375rem) {
  .nav-link-label,
  .logout-label,
  .identity-info,
  .identity-details,
  .nav-group-label {
    display: none;
  }
  .nav-group + .nav-group {
    border-top: 1px solid var(--eira-border-default);
    padding-top: var(--eira-space-3);
  }
  .nav-link,
  .logout {
    justify-content: center;
    padding: 0;
    width: var(--eira-size-touch);
  }
  .identity {
    align-items: center;
    padding: var(--eira-space-3) 0;
  }
}
</style>
