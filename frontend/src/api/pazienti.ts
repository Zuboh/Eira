import { eiraClient } from '@/api/eiraClient'
import type { components } from '@/api/schema'

export type Paziente = components['schemas']['PazienteRead']
export type PazienteCreatePayload = components['schemas']['PazienteCreate']
export type PazienteUpdatePayload = components['schemas']['PazienteUpdate']

type ApiResponse<T> = Promise<{ data: T }>

type OpenApiResult<TData, TError> = {
  data?: TData
  error?: TError
  response: Response
}

function formatOpenApiError(error: unknown, response: Response) {
  if (error === undefined) {
    return `Request failed with status ${response.status}`
  }

  if (typeof error === 'string') {
    return error
  }

  try {
    return JSON.stringify(error)
  } catch {
    return `Request failed with status ${response.status}`
  }
}

function unwrapData<TData, TError>(result: OpenApiResult<TData, TError>): { data: TData } {
  if (result.error !== undefined) {
    throw new Error(formatOpenApiError(result.error, result.response))
  }

  if (result.data === undefined) {
    throw new Error(`Response data is undefined for status ${result.response.status}`)
  }

  return { data: result.data }
}

export async function listPazienti(): ApiResponse<Paziente[]> {
  const result = await eiraClient.GET('/api/v1/pazienti/')
  return unwrapData(result)
}

export async function getPaziente(id: number): ApiResponse<Paziente> {
  const result = await eiraClient.GET('/api/v1/pazienti/{paziente_id}', {
    params: {
      path: {
        paziente_id: id,
      },
    },
  })
  return unwrapData(result)
}

export async function createPaziente(payload: PazienteCreatePayload): ApiResponse<Paziente> {
  const result = await eiraClient.POST('/api/v1/pazienti/', {
    body: payload,
  })
  return unwrapData(result)
}

export async function updatePaziente(
  id: number,
  payload: PazienteUpdatePayload,
): ApiResponse<Paziente> {
  const result = await eiraClient.PATCH('/api/v1/pazienti/{paziente_id}', {
    params: {
      path: {
        paziente_id: id,
      },
    },
    body: payload,
  })
  return unwrapData(result)
}
