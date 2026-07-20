import { eiraClient } from '@/api/eiraClient'
import type { components } from '@/api/schema'

export type StatoCoscienza = components['schemas']['StatoCoscienza']
export type ParametriVitali = components['schemas']['ParametriVitaliRead']
export type ParametriVitaliCreatePayload =
  components['schemas']['ParametriVitaliCreate']

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

function unwrapData<TData>(
  result: OpenApiResult<TData>,
  operation: string,
): { data: TData } {
  if (result.error !== undefined) {
    throw new Error(
      `${operation} failed: ${formatOpenApiError(result.error, result.response)}`,
    )
  }

  if (result.data === undefined) {
    throw new Error(`${operation} failed: response data is undefined`)
  }

  return { data: result.data }
}

export async function listParametriVitali(
  pazienteId: number,
): ApiDataResponse<ParametriVitali[]> {
  const result = await eiraClient.GET(
    '/api/v1/pazienti/{paziente_id}/parametri-vitali',
    {
      params: {
        path: {
          paziente_id: pazienteId,
        },
      },
    },
  )

  return unwrapData(result, 'listParametriVitali')
}

export async function createParametriVitali(
  pazienteId: number,
  payload: ParametriVitaliCreatePayload,
): ApiDataResponse<ParametriVitali> {
  const result = await eiraClient.POST(
    '/api/v1/pazienti/{paziente_id}/parametri-vitali',
    {
      params: {
        path: {
          paziente_id: pazienteId,
        },
      },
      body: payload,
    },
  )

  return unwrapData(result, 'createParametriVitali')
}
