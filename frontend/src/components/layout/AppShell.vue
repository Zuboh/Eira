<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const dashboardRoute = computed(() => ({ name: `${auth.ruolo}-dashboard` }))

const navItems = computed(() => {
  const items = [
    { to: dashboardRoute.value, label: 'Dashboard' },
    { to: { name: 'pazienti' }, label: 'Pazienti' },
    { to: { name: 'consegne-sbar' }, label: 'Consegne SBAR' },
    { to: { name: 'cambio-turno' }, label: 'Cambio Turno' },
    { to: { name: 'banca-ore' }, label: 'Banca Ore' },
  ]
  if (auth.ruolo === 'caposala') {
    items.push({ to: { name: 'caposala-staff' }, label: 'Personale' })
  }
  return items
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
}

.sidebar {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border);
  background: var(--surface);
  padding: 20px 12px;
}

.brand {
  font-family: var(--sans);
  font-weight: 700;
  font-size: 1.125rem;
  color: var(--ink);
  padding: 8px 12px 20px;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.nav-link {
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 0 12px;
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
  color: var(--color-primary);
  font-weight: 600;
}

.logout {
  min-height: 44px;
  padding: 0 12px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--steel);
  font-size: 0.875rem;
  text-align: left;
  cursor: pointer;
}

.logout:hover {
  background: var(--canvas);
  color: var(--state-urgente);
}

.logout:active {
  transform: scale(0.98);
}

.content {
  flex: 1;
  min-width: 0;
}
</style>
