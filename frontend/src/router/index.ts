import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { public: true },
    },
    {
      path: '/infermiere',
      name: 'infermiere-dashboard',
      component: () => import('@/views/infermiere/DashboardView.vue'),
      meta: { ruolo: 'infermiere' },
    },
    {
      path: '/caposala',
      name: 'caposala-dashboard',
      component: () => import('@/views/caposala/DashboardView.vue'),
      meta: { ruolo: 'caposala' },
    },
    {
      path: '/caposala/personale',
      name: 'caposala-staff',
      component: () => import('@/views/caposala/StaffView.vue'),
      meta: { ruolo: 'caposala' },
    },
    {
      path: '/pazienti',
      name: 'pazienti',
      component: () => import('@/views/PazientiView.vue'),
    },
    {
      path: '/pazienti/:id',
      name: 'paziente-scheda',
      component: () => import('@/views/SchedaPazienteView.vue'),
      props: true,
    },
    {
      path: '/consegne-sbar',
      name: 'consegne-sbar',
      component: () => import('@/views/ConsegneSbarView.vue'),
    },
    {
      path: '/cambio-turno',
      name: 'cambio-turno',
      component: () => import('@/views/CambioTurnoView.vue'),
    },
    {
      path: '/banca-ore',
      name: 'banca-ore',
      component: () => import('@/views/BancaOreView.vue'),
    },
    {
      path: '/',
      redirect: '/login',
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (to.meta.public) {
    return true
  }

  if (!auth.isAuthenticated) {
    return { name: 'login' }
  }

  if (auth.user === null) {
    try {
      await auth.fetchMe()
    } catch {
      auth.logout()
      return { name: 'login' }
    }
  }

  if (to.meta.ruolo && to.meta.ruolo !== auth.ruolo) {
    return { name: `${auth.ruolo}-dashboard` }
  }

  return true
})

export default router
