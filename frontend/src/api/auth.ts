import { eiraClient } from '@/api/eiraClient'
import type { components } from '@/api/schema'

type TokenSchema = components['schemas']['Token']
type UtenteReadSchema = components['schemas']['UtenteRead']
type TemporaryPasswordChangeSchema = components['schemas']['TemporaryPasswordChange']

export interface TokenResponse {
  access_token: TokenSchema['access_token']
  token_type: TokenSchema['token_type']
}

export interface MeResponse {
  id: UtenteReadSchema['id']
  email: UtenteReadSchema['email']
  nome: UtenteReadSchema['nome']
  cognome: UtenteReadSchema['cognome']
  ruolo: UtenteReadSchema['ruolo']
  reparto_id: UtenteReadSchema['reparto_id']
}

export interface ChangeTemporaryPasswordPayload {
  utente_id: TemporaryPasswordChangeSchema['utente_id']
  temporary_password: TemporaryPasswordChangeSchema['temporary_password']
  new_password: TemporaryPasswordChangeSchema['new_password']
}

type ApiResponse<T> = Promise<{ data: T }>

type OpenApiResult<TData, TError> = {
  data?: TData
  error?: TError
  response: Response
}

function formatApiError(error: unknown, response: Response) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (error === undefined) {
    return `Request failed with status ${response.status}`
  }

  try {
    return JSON.stringify(error)
  } catch {
    return `Request failed with status ${response.status}`
  }
}

function unwrapData<TData, TError>(
  result: OpenApiResult<TData, TError>,
  operation: string,
): { data: TData } {
  if (result.error !== undefined) {
    throw new Error(`${operation} failed: ${formatApiError(result.error, result.response)}`)
  }

  if (result.data === undefined) {
    throw new Error(`${operation} failed: response data is undefined`)
  }

  return { data: result.data }
}

export async function login(utenteId: number, password: string): ApiResponse<TokenResponse> {
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
): ApiResponse<MeResponse> {
  const result = await eiraClient.POST('/api/v1/auth/change-temporary-password', {
    body: payload,
  })

  return unwrapData(result, 'changeTemporaryPassword')
}

export async function me(): ApiResponse<MeResponse> {
  const result = await eiraClient.GET('/api/v1/auth/me')

  return unwrapData(result, 'me')
}
