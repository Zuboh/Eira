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
        <svg
          class="brand-wordmark"
          viewBox="51 -1563 3384 1641"
          aria-hidden="true"
        >
          <g fill="currentColor" transform="scale(1 -1)">
            <path
              d="M111 0H1180V264H419V624H1123V881H419V1226H1180V1490H111Z"
            />
            <path
              d="M104 0H399V1056H104ZM251 1189C348 1189 419 1256 419 1346C419 1436 348 1503 251 1503C154 1503 83 1436 83 1346C83 1256 154 1189 251 1189Z"
              transform="translate(1190 0)"
            />
            <path
              d="M104 0H399V572C399 731 488 815 609 815C659 815 714 811 736 810V1061C712 1062 683 1063 649 1063C510 1063 430 1003 391 876H388V1056H104Z"
              transform="translate(1638 0)"
            />
            <path
              d="M427 -18C589 -18 680 46 736 149H740V0H1028V716C1028 942 862 1078 573 1078C283 1078 111 940 98 722H375C382 803 454 859 564 859C672 859 737 805 737 727V720C737 652 669 643 476 624C256 604 64 536 64 298C64 87 216 -18 427 -18ZM509 187C410 187 346 231 346 306C346 390 426 429 527 444C622 459 705 473 739 492V386C739 272 651 187 509 187Z"
              transform="translate(2347 0)"
            />
          </g>
        </svg>
        <svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
          <path
            fill="currentColor"
            d="M111 0H1180V264H419V624H1123V881H419V1226H1180V1490H111Z"
            transform="translate(7.985 25.250) scale(0.012416 -0.012416)"
          />
        </svg>
      </RouterLink>
    </header>

    <aside v-else class="sidebar">
      <RouterLink :to="auth.landingRoute" class="brand" aria-label="Eira">
        <svg
          class="brand-wordmark"
          viewBox="51 -1563 3384 1641"
          aria-hidden="true"
        >
          <g fill="currentColor" transform="scale(1 -1)">
            <path
              d="M111 0H1180V264H419V624H1123V881H419V1226H1180V1490H111Z"
            />
            <path
              d="M104 0H399V1056H104ZM251 1189C348 1189 419 1256 419 1346C419 1436 348 1503 251 1503C154 1503 83 1436 83 1346C83 1256 154 1189 251 1189Z"
              transform="translate(1190 0)"
            />
            <path
              d="M104 0H399V572C399 731 488 815 609 815C659 815 714 811 736 810V1061C712 1062 683 1063 649 1063C510 1063 430 1003 391 876H388V1056H104Z"
              transform="translate(1638 0)"
            />
            <path
              d="M427 -18C589 -18 680 46 736 149H740V0H1028V716C1028 942 862 1078 573 1078C283 1078 111 940 98 722H375C382 803 454 859 564 859C672 859 737 805 737 727V720C737 652 669 643 476 624C256 604 64 536 64 298C64 87 216 -18 427 -18ZM509 187C410 187 346 231 346 306C346 390 426 429 527 444C622 459 705 473 739 492V386C739 272 651 187 509 187Z"
              transform="translate(2347 0)"
            />
          </g>
        </svg>
        <svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
          <path
            fill="currentColor"
            d="M111 0H1180V264H419V624H1123V881H419V1226H1180V1490H111Z"
            transform="translate(7.985 25.250) scale(0.012416 -0.012416)"
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
  color: var(--ink);
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
