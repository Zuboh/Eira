import { eiraClient } from '@/api/eiraClient'
import type { components } from '@/api/schema'

export type Reparto = components['schemas']['RepartoRead']
export type UtenteTile = components['schemas']['UtenteTile']

type ApiDataResponse<T> = Promise<{ data: T }>

type EiraResult<T> = {
  data?: T
  error?: unknown
}

function formatApiError(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  try {
    return JSON.stringify(error)
  } catch {
    return 'Unknown API error'
  }
}

function unwrapData<T>(result: EiraResult<T>, operation: string) {
  if (result.error !== undefined) {
    throw new Error(`${operation} failed: ${formatApiError(result.error)}`)
  }

  if (result.data === undefined) {
    throw new Error(`${operation} failed: response data is undefined`)
  }

  return { data: result.data }
}

export async function listReparti(): ApiDataResponse<Reparto[]> {
  const result = await eiraClient.GET('/api/v1/reparti/')

  return unwrapData(result, 'listReparti')
}

export async function listUtentiByReparto(id: number): ApiDataResponse<UtenteTile[]> {
  const result = await eiraClient.GET('/api/v1/reparti/{reparto_id}/utenti', {
    params: {
      path: {
        reparto_id: id,
      },
    },
  })

  return unwrapData(result, 'listUtentiByReparto')
}
