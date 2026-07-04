import apiClient from '@/api/client'

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface MeResponse {
  id: number
  email: string
  nome: string
  cognome: string
  ruolo: 'infermiere' | 'caposala'
  reparto_id: number
}

export function login(email: string, password: string) {
  const form = new URLSearchParams()
  form.append('username', email)
  form.append('password', password)
  return apiClient.post<TokenResponse>('/auth/token', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

export function me() {
  return apiClient.get<MeResponse>('/auth/me')
}
