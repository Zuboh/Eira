<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import Drawer from 'primevue/drawer'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { useAuthStore } from '@/stores/auth'
import AppNavPanel from '@/components/layout/AppNavPanel.vue'

const auth = useAuthStore()

/* Sotto 768px la sidebar diventava una striscia a scroll orizzontale con
   ~1.5 voci visibili su 6 (8 per caposala) e nessuna affordance: passa a
   drawer off-canvas. PrimeVue Drawer porta focus-trap, Esc e aria-modal. */
const isCompact = useMediaQuery('(max-width: 47.9375rem)')
const drawerOpen = ref(false)

watch(isCompact, (compact) => {
  if (!compact) drawerOpen.value = false
})
</script>

<template>
  <div class="app-shell">
    <header v-if="isCompact" class="topbar">
      <button
        type="button"
        class="topbar-toggle"
        aria-controls="app-nav-drawer"
        aria-label="Apri il menu di navigazione"
        :aria-expanded="drawerOpen"
        @click="drawerOpen = true"
      >
        <i class="pi pi-bars" aria-hidden="true" />
      </button>
      <RouterLink :to="auth.landingRoute" class="brand">
        <span class="brand-label">Eira</span>
      </RouterLink>
    </header>

    <aside v-else class="sidebar">
      <RouterLink :to="auth.landingRoute" class="brand">
        <span class="brand-label">Eira</span>
      </RouterLink>
      <AppNavPanel />
    </aside>

    <Drawer
      id="app-nav-drawer"
      v-model:visible="drawerOpen"
      class="nav-drawer"
      header="Eira"
      position="left"
    >
      <AppNavPanel @navigate="drawerOpen = false" />
    </Drawer>

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
  display: flex;
  align-items: center;
  min-height: var(--size-touch);
  font-family: var(--sans);
  font-weight: 700;
  font-size: 1.125rem;
  color: var(--ink);
  text-decoration: none;
  padding: var(--space-2) var(--space-3) var(--space-5);
  border-radius: var(--radius-sm);
}

.brand:focus-visible,
.topbar-toggle:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.content {
  flex: 1;
  min-width: 0;
}

/* Tablet — DESIGN.md sez. 7: sidebar collassabile a icone */
@media (min-width: 48rem) and (max-width: 63.9375rem) {
  .sidebar {
    /* non 4rem: seguiva la scala tipografica e con root a 15px valeva
       60px, meno dei 44px di --size-touch piu' il padding. I figli sono
       ancorati ai px, la larghezza del rail deve esserlo con loro. */
    width: calc(var(--size-touch) + 2 * var(--space-3));
    align-items: center;
    padding: var(--space-5) var(--space-2);
  }

  .brand-label {
    display: none;
  }

  /* senza label il link resta largo quanto il padding: sotto i 44px */
  .brand {
    justify-content: center;
    min-width: var(--size-touch);
    padding: var(--space-2) 0 var(--space-5);
  }
}

/* Mobile — topbar + drawer. Il limite e' 47.9375rem e non 48rem per non
   sovrapporsi alla query tablet, che parte esattamente da 48rem. */
@media (max-width: 47.9375rem) {
  .app-shell {
    flex-direction: column;
  }

  .topbar {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    border-bottom: 1px solid var(--border);
    background: var(--canvas);
    padding: var(--space-2);
  }

  .brand {
    padding: 0 var(--space-2);
  }

  .topbar-toggle {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: var(--size-touch);
    height: var(--size-touch);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--ink);
    cursor: pointer;
  }

  .topbar-toggle i {
    font-size: 1.125rem;
  }
}
</style>

<style>
/* Il Drawer di PrimeVue viene teleportato su body: fuori dalla portata
   degli stili scoped di questo componente. */
.nav-drawer.p-drawer {
  width: 17rem;
  max-width: 85vw;
  background: var(--canvas);
  border-right: 1px solid var(--border);
}

.nav-drawer .p-drawer-header {
  padding: var(--space-4) var(--space-3) var(--space-2);
}

.nav-drawer .p-drawer-title {
  font-family: var(--sans);
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--ink);
}

/* PrimeVue fissa height sul close button: serve min-height per arrivare a 44 */
.nav-drawer .p-drawer-close-button {
  width: var(--size-touch);
  height: var(--size-touch);
  min-width: var(--size-touch);
  min-height: var(--size-touch);
}

.nav-drawer .p-drawer-content {
  display: flex;
  padding: 0 var(--space-3) var(--space-4);
}

@media (prefers-reduced-motion: reduce) {
  .nav-drawer.p-drawer,
  .p-drawer-mask {
    transition: none !important;
    animation: none !important;
  }
}
</style>
