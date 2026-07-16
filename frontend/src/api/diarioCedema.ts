import { eiraClient } from '@/api/eiraClient'
import type { components } from '@/api/schema'

export type VoceDiarioCedema = components['schemas']['VoceDiarioCedemaRead']
export type VoceDiarioCedemaCreatePayload = components['schemas']['VoceDiarioCedemaCreate']

type ApiDataResponse<T> = Promise<{ data: T }>

type OpenApiResult<TData> = {
  data?: TData
  error?: unknown
  response: Response
}

function formatOpenApiError(error: unknown, response: Response) {
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

function unwrapData<TData>(result: OpenApiResult<TData>, operation: string): { data: TData } {
  if (result.error !== undefined) {
    throw new Error(`${operation} failed: ${formatOpenApiError(result.error, result.response)}`)
  }

  if (result.data === undefined) {
    throw new Error(`${operation} failed: response data is undefined`)
  }

  return { data: result.data }
}

export async function listDiarioCedema(
  pazienteId: number,
): ApiDataResponse<VoceDiarioCedema[]> {
  const result = await eiraClient.GET('/api/v1/pazienti/{paziente_id}/diario-cedema', {
    params: {
      path: {
        paziente_id: pazienteId,
      },
    },
  })

  return unwrapData(result, 'listDiarioCedema')
}

export async function createVoceDiarioCedema(
  pazienteId: number,
  payload: VoceDiarioCedemaCreatePayload,
): ApiDataResponse<VoceDiarioCedema> {
  const result = await eiraClient.POST('/api/v1/pazienti/{paziente_id}/diario-cedema', {
    params: {
      path: {
        paziente_id: pazienteId,
      },
    },
    body: payload,
  })

  return unwrapData(result, 'createVoceDiarioCedema')
}
