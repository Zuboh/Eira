import { eiraClient } from '@/api/eiraClient'
import { unwrapData } from '@/api/apiError'
import type { components } from '@/api/schema'

export type PrioritaConsegna = components['schemas']['PrioritaConsegna']
export type ConsegnaSbar = components['schemas']['ConsegnaSbarRead']
export type ConsegnaSbarCreatePayload =
  components['schemas']['ConsegnaSbarCreate']
export type ConsegnaSbarUpdatePayload =
  components['schemas']['ConsegnaSbarUpdate']
export type ConsegneSbarPage = components['schemas']['ConsegneSbarPage']

type ApiDataResponse<T> = Promise<{ data: T }>

export async function listConsegneSbar(
  params: {
    skip?: number
    limit?: number
  } = {},
): ApiDataResponse<ConsegneSbarPage> {
  const result = await eiraClient.GET('/api/v1/consegne-sbar/', {
    params: { query: params },
  })

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

export async function listConsegneSbarByPaziente(
  pazienteId: number,
): ApiDataResponse<ConsegnaSbar[]> {
  const result = await eiraClient.GET(
    '/api/v1/consegne-sbar/pazienti/{paziente_id}',
    {
      params: {
        path: {
          paziente_id: pazienteId,
        },
      },
    },
  )

  return unwrapData(result, 'listConsegneSbarByPaziente')
}

/** `null` quando il paziente non ha consegne precedenti: caso normale. */
export async function getUltimaConsegnaSbar(
  pazienteId: number,
): ApiDataResponse<ConsegnaSbar | null> {
  const result = await eiraClient.GET(
    '/api/v1/consegne-sbar/pazienti/{paziente_id}/ultima',
    {
      params: {
        path: {
          paziente_id: pazienteId,
        },
      },
    },
  )

  return unwrapData(result, 'getUltimaConsegnaSbar')
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
