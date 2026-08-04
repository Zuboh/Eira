import { eiraClient } from '@/api/eiraClient'
import { unwrapData } from '@/api/apiError'
import type { components } from '@/api/schema'

type TokenSchema = components['schemas']['Token']
type UtenteReadSchema = components['schemas']['UtenteRead']
type MeReadSchema = components['schemas']['MeRead']
type TemporaryPasswordChangeSchema =
  components['schemas']['TemporaryPasswordChange']

export interface TokenResponse {
  access_token: TokenSchema['access_token']
  token_type: TokenSchema['token_type']
}

export interface UtenteResponse {
  id: UtenteReadSchema['id']
  email: UtenteReadSchema['email']
  nome: UtenteReadSchema['nome']
  cognome: UtenteReadSchema['cognome']
  ruolo: UtenteReadSchema['ruolo']
  reparto_id: UtenteReadSchema['reparto_id']
  avatar_url?: UtenteReadSchema['avatar_url']
}

export interface MeResponse extends UtenteResponse {
  reparto_nome: MeReadSchema['reparto_nome']
}

export interface ChangeTemporaryPasswordPayload {
  utente_id: TemporaryPasswordChangeSchema['utente_id']
  temporary_password: TemporaryPasswordChangeSchema['temporary_password']
  new_password: TemporaryPasswordChangeSchema['new_password']
}

type ApiResponse<T> = Promise<{ data: T }>

export async function login(
  utenteId: number,
  password: string,
): ApiResponse<TokenResponse> {
  const result = await eiraClient.POST('/api/v1/auth/token', {
    body: {
      username: String(utenteId),
      password,
      scope: '',
    },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  return unwrapData(result, 'login')
}

export async function changeTemporaryPassword(
  payload: ChangeTemporaryPasswordPayload,
): ApiResponse<UtenteResponse> {
  const result = await eiraClient.POST(
    '/api/v1/auth/change-temporary-password',
    {
      body: payload,
    },
  )

  return unwrapData(result, 'changeTemporaryPassword')
}

export async function me(): ApiResponse<MeResponse> {
  const result = await eiraClient.GET('/api/v1/auth/me')

  return unwrapData(result, 'me')
}

export async function uploadMyAvatar(file: File): ApiResponse<MeResponse> {
  const body = new FormData()
  body.append('file', file)
  const result = await eiraClient.POST('/api/v1/auth/me/avatar', {
    // openapi-typescript generates the multipart body as { file: string }
    // (no native Blob/File type for binary form fields) — the actual
    // request is a real FormData with a File, cast to satisfy the type.
    body: body as unknown as { file: string },
  })

  return unwrapData(result, 'uploadMyAvatar')
}
