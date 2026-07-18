<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
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
    }))
})

function logout() {
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand">Eira</div>
      <nav class="nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.label"
          :to="item.to"
          class="nav-link"
          active-class="active"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
      <button type="button" class="logout" @click="logout">Esci</button>
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
  background: var(--surface);
  padding: var(--space-5) var(--space-3);
}

.brand {
  font-family: var(--sans);
  font-weight: 700;
  font-size: 1.125rem;
  color: var(--ink);
  padding: var(--space-2) var(--space-3) var(--space-5);
}

.nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1;
}

.nav-link {
  display: flex;
  align-items: center;
  min-height: var(--size-touch);
  padding: 0 var(--space-3);
  border-radius: var(--radius-sm);
  color: var(--steel);
  text-decoration: none;
  font-size: 0.9375rem;
  font-weight: 500;
  transition: background 150ms ease-out;
}

.nav-link:hover {
  background: var(--canvas);
}

.nav-link.active {
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  color: var(--color-primary-on-tint);
  font-weight: 600;
}

.logout {
  min-height: var(--size-touch);
  padding: 0 var(--space-3);
  border: none;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--state-urgente) 10%, transparent);
  color: var(--state-urgente-on-tint);
  font-size: 0.875rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
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

  .logout {
    flex: 0 0 auto;
    min-height: 2.5rem;
    padding-inline: var(--space-3);
    white-space: nowrap;
  }
}
</style>
