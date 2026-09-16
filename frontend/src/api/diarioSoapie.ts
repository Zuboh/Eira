import { eiraClient } from '@/api/eiraClient'
import { unwrapData } from '@/api/apiError'
import type { components } from '@/api/schema'

export type VoceDiarioSoapie = components['schemas']['VoceDiarioSoapieRead']
export type VoceDiarioSoapieCreatePayload =
  components['schemas']['VoceDiarioSoapieCreate']

type ApiDataResponse<T> = Promise<{ data: T }>

export async function listDiarioSoapie(
  pazienteId: number,
): ApiDataResponse<VoceDiarioSoapie[]> {
  const result = await eiraClient.GET(
    '/api/v1/pazienti/{paziente_id}/diario-soapie',
    {
      params: {
        path: {
          paziente_id: pazienteId,
        },
      },
    },
  )

  return unwrapData(result, 'listDiarioSoapie')
}

/** `null` quando il paziente non ha voci precedenti: caso normale. */
export async function getUltimaVoceDiarioSoapie(
  pazienteId: number,
): ApiDataResponse<VoceDiarioSoapie | null> {
  const result = await eiraClient.GET(
    '/api/v1/pazienti/{paziente_id}/diario-soapie/ultima',
    {
      params: {
        path: {
          paziente_id: pazienteId,
        },
      },
    },
  )

  return unwrapData(result, 'getUltimaVoceDiarioSoapie')
}

export async function createVoceDiarioSoapie(
  pazienteId: number,
  payload: VoceDiarioSoapieCreatePayload,
): ApiDataResponse<VoceDiarioSoapie> {
  const result = await eiraClient.POST(
    '/api/v1/pazienti/{paziente_id}/diario-soapie',
    {
      params: {
        path: {
          paziente_id: pazienteId,
        },
      },
      body: payload,
    },
  )

  return unwrapData(result, 'createVoceDiarioSoapie')
}
