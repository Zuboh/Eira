import { createRouter, createWebHistory } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { MeResponse } from '@/api/auth'

type UserRole = MeResponse['ruolo']

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
    roles?: readonly UserRole[]
    nav?: {
      label: string
      order: number
    }
  }
}

const ALL_ROLES = [
  'infermiere',
  'caposala',
] as const satisfies readonly UserRole[]

function landingRouteForRole(role: UserRole | null): RouteLocationRaw {
  switch (role) {
    case 'infermiere':
      return { name: 'infermiere-dashboard' }
    case 'caposala':
      return { name: 'caposala-dashboard' }
    default:
      return { name: 'login' }
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: { template: '' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/infermiere',
      name: 'infermiere-dashboard',
      component: () => import('@/views/infermiere/DashboardView.vue'),
      meta: { roles: ['infermiere'], nav: { label: 'Dashboard', order: 10 } },
    },
    {
      path: '/caposala',
      name: 'caposala-dashboard',
      component: () => import('@/views/caposala/DashboardView.vue'),
      meta: { roles: ['caposala'], nav: { label: 'Dashboard', order: 10 } },
    },
    {
      path: '/caposala/personale',
      name: 'caposala-staff',
      component: () => import('@/views/caposala/StaffView.vue'),
      meta: { roles: ['caposala'], nav: { label: 'Personale', order: 60 } },
    },
    {
      path: '/pazienti',
      name: 'pazienti',
      component: () => import('@/views/PazientiView.vue'),
      meta: { roles: ALL_ROLES, nav: { label: 'Pazienti', order: 20 } },
    },
    {
      path: '/pazienti/:id',
      name: 'paziente-scheda',
      component: () => import('@/views/SchedaPazienteView.vue'),
      props: true,
      meta: { roles: ALL_ROLES },
    },
    {
      path: '/consegne-sbar',
      name: 'consegne-sbar',
      component: () => import('@/views/ConsegneSbarView.vue'),
      meta: { roles: ALL_ROLES, nav: { label: 'Consegne SBAR', order: 30 } },
    },
    {
      path: '/cambio-turno',
      name: 'cambio-turno',
      component: () => import('@/views/CambioTurnoView.vue'),
      meta: { roles: ALL_ROLES, nav: { label: 'Cambio Turno', order: 40 } },
    },
    {
      path: '/ferie',
      name: 'ferie',
      component: () => import('@/views/FerieView.vue'),
      meta: { roles: ALL_ROLES, nav: { label: 'Ferie', order: 45 } },
    },
    {
      path: '/banca-ore',
      name: 'banca-ore',
      component: () => import('@/views/BancaOreView.vue'),
      meta: { roles: ['caposala'], nav: { label: 'Banca Ore', order: 50 } },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (to.name === 'home') {
    const hasSession = await auth.ensureSession()
    return hasSession ? landingRouteForRole(auth.ruolo) : { name: 'login' }
  }

  if (to.name === 'login' && auth.isAuthenticated) {
    const hasUser = await auth.ensureSession()
    return hasUser ? landingRouteForRole(auth.ruolo) : true
  }

  if (to.meta.public) {
    return true
  }

  if (!auth.isAuthenticated) {
    return { name: 'login' }
  }

  const hasUser = await auth.ensureSession()
  if (!hasUser) {
    return { name: 'login' }
  }

  if (to.meta.roles) {
    if (auth.ruolo === null) {
      return { name: 'login' }
    }

    if (!to.meta.roles.includes(auth.ruolo)) {
      return landingRouteForRole(auth.ruolo)
    }
  }

  return true
})

export default router
