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
      <RouterLink :to="auth.landingRoute" class="brand" aria-label="Eira">
        <svg class="brand-wordmark" viewBox="0 0 320 96" aria-hidden="true">
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
        <svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
          <path
            fill="currentColor"
            d="M8 7h15a3 3 0 1 1 0 6h-9v2h7a3 3 0 1 1 0 6h-7v2h9a3 3 0 1 1 0 6H8V7z"
          />
        </svg>
      </RouterLink>
    </header>

    <aside v-else class="sidebar">
      <RouterLink :to="auth.landingRoute" class="brand" aria-label="Eira">
        <svg class="brand-wordmark" viewBox="0 0 320 96" aria-hidden="true">
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
        <svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
          <path
            fill="currentColor"
            d="M8 7h15a3 3 0 1 1 0 6h-9v2h7a3 3 0 1 1 0 6h-7v2h9a3 3 0 1 1 0 6H8V7z"
          />
        </svg>
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
  color: var(--color-primary-on-tint);
  text-decoration: none;
  padding: var(--space-2) var(--space-3) var(--space-5);
  border-radius: var(--radius-sm);
}

.brand-wordmark {
  height: 1.75rem;
  width: auto;
}

.brand-mark {
  display: none;
  height: 1.5rem;
  width: 1.5rem;
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

  .brand-wordmark {
    display: none;
  }

  .brand-mark {
    display: block;
  }

  /* senza wordmark il link resta largo quanto il padding: sotto i 44px */
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
