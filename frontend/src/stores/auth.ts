import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authApi from '@/api/auth'
import type { MeResponse } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('eira_token'))
  const user = ref<MeResponse | null>(null)

  const isAuthenticated = computed(() => !!token.value)
  const ruolo = computed(() => user.value?.ruolo ?? null)

  async function login(email: string, password: string) {
    const { data } = await authApi.login(email, password)
    token.value = data.access_token
    localStorage.setItem('eira_token', data.access_token)
    await fetchMe()
  }

  async function fetchMe() {
    const { data } = await authApi.me()
    user.value = data
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('eira_token')
  }

  return { token, user, isAuthenticated, ruolo, login, fetchMe, logout }
})
