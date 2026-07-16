import { eiraClient } from '@/api/eiraClient'
import type { components } from '@/api/schema'

export type ValutazioneNortonCreatePayload = components['schemas']['ValutazioneNortonCreate']
export type ValutazioneNorton = components['schemas']['ValutazioneNortonRead']
export type ValutazioneConleyCreatePayload = components['schemas']['ValutazioneConleyCreate']
export type ValutazioneConley = components['schemas']['ValutazioneConleyRead']
export type ValutazioniAggregate = components['schemas']['ValutazioniAggregateRead']

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

export async function getValutazioni(pazienteId: number): ApiDataResponse<ValutazioniAggregate> {
  const result = await eiraClient.GET('/api/v1/pazienti/{paziente_id}/valutazioni', {
    params: {
      path: {
        paziente_id: pazienteId,
      },
    },
  })

  return unwrapData(result, 'getValutazioni')
}

export async function createNorton(
  pazienteId: number,
  payload: ValutazioneNortonCreatePayload,
): ApiDataResponse<ValutazioneNorton> {
  const result = await eiraClient.POST('/api/v1/pazienti/{paziente_id}/norton', {
    params: {
      path: {
        paziente_id: pazienteId,
      },
    },
    body: payload,
  })

  return unwrapData(result, 'createNorton')
}

export async function createConley(
  pazienteId: number,
  payload: ValutazioneConleyCreatePayload,
): ApiDataResponse<ValutazioneConley> {
  const result = await eiraClient.POST('/api/v1/pazienti/{paziente_id}/conley', {
    params: {
      path: {
        paziente_id: pazienteId,
      },
    },
    body: payload,
  })

  return unwrapData(result, 'createConley')
}
