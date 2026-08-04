import { eiraClient } from '@/api/eiraClient'
import { unwrapData } from '@/api/apiError'
import type { components } from '@/api/schema'

export type Farmaco = components['schemas']['FarmacoRead']
export type CarelloFarmaco = components['schemas']['CarelloFarmacoRead']
export type CarelloFarmacoUpdatePayload =
  components['schemas']['CarelloFarmacoUpdate']
export type MovimentoFarmaco = components['schemas']['MovimentoFarmacoRead']

type ApiDataResponse<T> = Promise<{ data: T }>

export async function listCarelloFarmaci(
  params: { search?: string; categoria?: string } = {},
): ApiDataResponse<CarelloFarmaco[]> {
  const result = await eiraClient.GET('/api/v1/carello-farmaci/', {
    params: { query: params },
  })

  return unwrapData(result, 'listCarelloFarmaci')
}

export async function updateCarelloFarmaco(
  id: number,
  payload: CarelloFarmacoUpdatePayload,
): ApiDataResponse<CarelloFarmaco> {
  const result = await eiraClient.PATCH(
    '/api/v1/carello-farmaci/{carello_id}',
    {
      params: { path: { carello_id: id } },
      body: payload,
    },
  )

  return unwrapData(result, 'updateCarelloFarmaco')
}

export async function listMovimentiFarmaci(
  params: { farmaco_id?: number } = {},
): ApiDataResponse<MovimentoFarmaco[]> {
  const result = await eiraClient.GET('/api/v1/carello-farmaci/movimenti', {
    params: { query: params },
  })

  return unwrapData(result, 'listMovimentiFarmaci')
}
