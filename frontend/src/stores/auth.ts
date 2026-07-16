import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authApi from '@/api/auth'
import type { MeResponse } from '@/api/auth'

type SessionStatus = 'unknown' | 'authenticated' | 'anonymous'
type UserRole = MeResponse['ruolo']
type LandingRoute = { name: 'login' | `${UserRole}-dashboard` }

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('eira_token'))
  const user = ref<MeResponse | null>(null)
  const status = ref<SessionStatus>(token.value ? 'unknown' : 'anonymous')

  const isAuthenticated = computed(() => !!token.value)
  const ruolo = computed(() => user.value?.ruolo ?? null)
  const landingRoute = computed<LandingRoute>(() => {
    if (ruolo.value) {
      return { name: `${ruolo.value}-dashboard` }
    }

    return { name: 'login' }
  })

  async function login(utenteId: number, password: string) {
    const { data } = await authApi.login(utenteId, password)
    token.value = data.access_token
    status.value = 'unknown'
    localStorage.setItem('eira_token', data.access_token)

    try {
      await fetchMe()
    } catch (error) {
      clearSession('login_failed')
      throw error
    }
  }

  async function fetchMe() {
    const { data } = await authApi.me()
    user.value = data
    status.value = 'authenticated'
  }

  async function ensureSession() {
    if (status.value === 'authenticated') {
      return true
    }

    if (!token.value) {
      clearSession('missing_token')
      return false
    }

    try {
      await fetchMe()
      return true
    } catch {
      clearSession('invalid_session')
      return false
    }
  }

  function clearSession(_reason?: string) {
    token.value = null
    user.value = null
    status.value = 'anonymous'
    localStorage.removeItem('eira_token')
  }

  function logout() {
    clearSession('logout')
  }

  return {
    token,
    user,
    status,
    isAuthenticated,
    ruolo,
    landingRoute,
    login,
    fetchMe,
    ensureSession,
    clearSession,
    logout,
  }
})
