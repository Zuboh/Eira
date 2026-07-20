import { eiraClient } from '@/api/eiraClient'
import type { components } from '@/api/schema'

export type Farmaco = components['schemas']['FarmacoRead']
export type CarelloFarmaco = components['schemas']['CarelloFarmacoRead']
export type CarelloFarmacoUpdatePayload = components['schemas']['CarelloFarmacoUpdate']
export type MovimentoFarmaco = components['schemas']['MovimentoFarmacoRead']

type ApiDataResponse<T> = Promise<{ data: T }>

type OpenApiResult<TData> = {
  data?: TData
  error?: unknown
  response: Response
}

function formatOpenApiError(error: unknown, response: Response) {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (error === undefined) return `Request failed with status ${response.status}`

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
  const result = await eiraClient.PATCH('/api/v1/carello-farmaci/{carello_id}', {
    params: { path: { carello_id: id } },
    body: payload,
  })

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
