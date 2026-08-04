import { eiraClient } from '@/api/eiraClient'
import { unwrapData } from '@/api/apiError'
import type { components } from '@/api/schema'

export type Paziente = components['schemas']['PazienteRead']
export type PazienteCreatePayload = components['schemas']['PazienteCreate']
export type PazienteUpdatePayload = components['schemas']['PazienteUpdate']

type ApiResponse<T> = Promise<{ data: T }>

export async function listPazienti(): ApiResponse<Paziente[]> {
  const result = await eiraClient.GET('/api/v1/pazienti/')
  return unwrapData(result, 'listPazienti')
}

export async function getPaziente(id: number): ApiResponse<Paziente> {
  const result = await eiraClient.GET('/api/v1/pazienti/{paziente_id}', {
    params: {
      path: {
        paziente_id: id,
      },
    },
  })
  return unwrapData(result, 'getPaziente')
}

export async function createPaziente(
  payload: PazienteCreatePayload,
): ApiResponse<Paziente> {
  const result = await eiraClient.POST('/api/v1/pazienti/', {
    body: payload,
  })
  return unwrapData(result, 'createPaziente')
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
  return unwrapData(result, 'updatePaziente')
}
