import { eiraClient } from '@/api/eiraClient'
import { unwrapData } from '@/api/apiError'
import type { components } from '@/api/schema'

export type StatoCoscienza = components['schemas']['StatoCoscienza']
export type ParametriVitali = components['schemas']['ParametriVitaliRead']
export type ParametriVitaliCreatePayload =
  components['schemas']['ParametriVitaliCreate']

type ApiDataResponse<T> = Promise<{ data: T }>

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
