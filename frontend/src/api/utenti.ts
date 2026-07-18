import { eiraClient } from '@/api/eiraClient'
import type { components } from '@/api/schema'

export type StatoUtente = components['schemas']['StatoUtente']
export type Utente = components['schemas']['UtenteRead']
export type RuoloUtente = components['schemas']['RuoloUtente']
export type UtenteCreatePayload = components['schemas']['UtenteCreate']

type TemporaryPasswordResponse = components['schemas']['TemporaryPasswordResponse']
type UpdateUtentePayload = Partial<Pick<Utente, 'stato'>>
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


export async function createUtente(payload: UtenteCreatePayload): ApiResponse<Utente> {
  const result = await eiraClient.POST('/api/v1/utenti/', {
    body: payload,
  })

  return unwrapData(result, 'createUtente')
}

export async function listUtenti(): ApiResponse<Utente[]> {
  const result = await eiraClient.GET('/api/v1/utenti/')

  return unwrapData(result, 'listUtenti')
}

export async function updateUtente(id: number, payload: UpdateUtentePayload): ApiResponse<Utente> {
  const result = await eiraClient.PATCH('/api/v1/utenti/{utente_id}', {
    params: {
      path: {
        utente_id: id,
      },
    },
    body: payload,
  })

  return unwrapData(result, 'updateUtente')
}

export async function createTemporaryPassword(id: number): ApiResponse<TemporaryPasswordResponse> {
  const result = await eiraClient.POST('/api/v1/utenti/{utente_id}/password-temporanea', {
    params: {
      path: {
        utente_id: id,
      },
    },
  })

  return unwrapData(result, 'createTemporaryPassword')
}
