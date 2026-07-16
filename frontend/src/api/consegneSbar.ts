import { eiraClient } from '@/api/eiraClient'
import type { components } from '@/api/schema'

export type PrioritaConsegna = components['schemas']['PrioritaConsegna']
export type ConsegnaSbar = components['schemas']['ConsegnaSbarRead']
export type ConsegnaSbarCreatePayload = components['schemas']['ConsegnaSbarCreate']
export type ConsegnaSbarUpdatePayload = components['schemas']['ConsegnaSbarUpdate']

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
    throw new Error(`${operation} failed: ${formatOpenApiError(result.error, result.response)}`)
  }

  if (result.data === undefined) {
    throw new Error(`${operation} failed: response data is undefined`)
  }

  return { data: result.data }
}

export async function listConsegneSbar(): ApiDataResponse<ConsegnaSbar[]> {
  const result = await eiraClient.GET('/api/v1/consegne-sbar/')

  return unwrapData(result, 'listConsegneSbar')
}

export async function createConsegnaSbar(
  payload: ConsegnaSbarCreatePayload,
): ApiDataResponse<ConsegnaSbar> {
  const result = await eiraClient.POST('/api/v1/consegne-sbar/', {
    body: payload,
  })

  return unwrapData(result, 'createConsegnaSbar')
}

export async function updateConsegnaSbar(
  id: number,
  payload: ConsegnaSbarUpdatePayload,
): ApiDataResponse<ConsegnaSbar> {
  const result = await eiraClient.PATCH('/api/v1/consegne-sbar/{consegna_id}', {
    params: {
      path: {
        consegna_id: id,
      },
    },
    body: payload,
  })

  return unwrapData(result, 'updateConsegnaSbar')
}
