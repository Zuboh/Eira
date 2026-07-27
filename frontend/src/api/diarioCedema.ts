import { eiraClient } from '@/api/eiraClient'
import { unwrapData } from '@/api/apiError'
import type { components } from '@/api/schema'

export type VoceDiarioCedema = components['schemas']['VoceDiarioCedemaRead']
export type VoceDiarioCedemaCreatePayload =
  components['schemas']['VoceDiarioCedemaCreate']

type ApiDataResponse<T> = Promise<{ data: T }>

export async function listDiarioCedema(
  pazienteId: number,
): ApiDataResponse<VoceDiarioCedema[]> {
  const result = await eiraClient.GET(
    '/api/v1/pazienti/{paziente_id}/diario-cedema',
    {
      params: {
        path: {
          paziente_id: pazienteId,
        },
      },
    },
  )

  return unwrapData(result, 'listDiarioCedema')
}

/** `null` quando il paziente non ha voci precedenti: caso normale. */
export async function getUltimaVoceDiarioCedema(
  pazienteId: number,
): ApiDataResponse<VoceDiarioCedema | null> {
  const result = await eiraClient.GET(
    '/api/v1/pazienti/{paziente_id}/diario-cedema/ultima',
    {
      params: {
        path: {
          paziente_id: pazienteId,
        },
      },
    },
  )

  return unwrapData(result, 'getUltimaVoceDiarioCedema')
}

export async function createVoceDiarioCedema(
  pazienteId: number,
  payload: VoceDiarioCedemaCreatePayload,
): ApiDataResponse<VoceDiarioCedema> {
  const result = await eiraClient.POST(
    '/api/v1/pazienti/{paziente_id}/diario-cedema',
    {
      params: {
        path: {
          paziente_id: pazienteId,
        },
      },
      body: payload,
    },
  )

  return unwrapData(result, 'createVoceDiarioCedema')
}
