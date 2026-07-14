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

export interface RegisterPayload {
  email: string
  password: string
  nome: string
  cognome: string
  reparto_id: number
}

export interface RegisterResponse {
  id: number
  email: string
  nome: string
  cognome: string
  ruolo: 'infermiere' | 'caposala'
  reparto_id: number
  stato: 'in_attesa' | 'attivo' | 'disattivato'
}

export function login(utenteId: number, password: string) {
  const form = new URLSearchParams()
  form.append('username', String(utenteId))
  form.append('password', password)
  return apiClient.post<TokenResponse>('/auth/token', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

export function register(payload: RegisterPayload) {
  return apiClient.post<RegisterResponse>('/auth/register', payload)
}

export function me() {
  return apiClient.get<MeResponse>('/auth/me')
}
