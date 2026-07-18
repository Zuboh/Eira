import createClient, { type Middleware } from 'openapi-fetch'
import { useAuthStore } from '@/stores/auth'
import type { paths } from '@/api/schema'

const API_PREFIX_IN_SCHEMA = '/api/v1'
const DEFAULT_API_ROOT_URL = 'http://localhost:8000'

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, '')
}

function resolveBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL as
    string | undefined
  const baseUrl = trimTrailingSlash(configuredBaseUrl ?? DEFAULT_API_ROOT_URL)

  if (baseUrl.endsWith(API_PREFIX_IN_SCHEMA)) {
    return baseUrl.slice(0, -API_PREFIX_IN_SCHEMA.length) || '/'
  }

  return baseUrl
}

const authMiddleware: Middleware = {
  onRequest({ request }) {
    const auth = useAuthStore()

    if (auth.token) {
      request.headers.set('Authorization', `Bearer ${auth.token}`)
    }

    return request
  },
  onResponse({ response }) {
    if (response.status === 401) {
      const auth = useAuthStore()
      auth.clearSession('unauthorized')
    }

    return response
  },
}

export const eiraClient = createClient<paths>({
  baseUrl: resolveBaseUrl(),
})

eiraClient.use(authMiddleware)

export default eiraClient
