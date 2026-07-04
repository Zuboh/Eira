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
      path: '/',
      redirect: '/login',
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.public) {
    return true
  }

  if (!auth.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.ruolo && to.meta.ruolo !== auth.ruolo) {
    return { name: `${auth.ruolo}-dashboard` }
  }

  return true
})

export default router
