import { eiraClient } from '@/api/eiraClient'
import type { components } from '@/api/schema'

export type TipoTurno = components['schemas']['TipoTurno']
export type StatoAssegnazione = components['schemas']['StatoAssegnazione']
export type Turno = components['schemas']['TurnoRead']
export type AssegnazioneTurno = components['schemas']['AssegnazioneTurnoRead']
export type TurnoCalendario = components['schemas']['TurnoCalendarioRead']

type ApiDataResponse<T> = Promise<{ data: T }>

type EiraResult<T> = {
  data?: T
  error?: unknown
  response: Response
}

function formatApiError(error: unknown, response: Response) {
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

function unwrapData<T>(result: EiraResult<T>, operation: string): { data: T } {
  if (result.error !== undefined) {
    throw new Error(`${operation} failed: ${formatApiError(result.error, result.response)}`)
  }

  if (result.data === undefined) {
    throw new Error(`${operation} failed: response data is undefined`)
  }

  return { data: result.data }
}

export async function getMieAssegnazioni(): ApiDataResponse<AssegnazioneTurno[]> {
  const result = await eiraClient.GET('/api/v1/turni/mie-assegnazioni')

  return unwrapData(result, 'getMieAssegnazioni')
}

export async function listTurni(): ApiDataResponse<Turno[]> {
  const result = await eiraClient.GET('/api/v1/turni/')

  return unwrapData(result, 'listTurni')
}

export async function getCalendarioTurni(): ApiDataResponse<TurnoCalendario[]> {
  const result = await eiraClient.GET('/api/v1/turni/calendario')

  return unwrapData(result, 'getCalendarioTurni')
}

export async function assegnaTurno(
  turnoId: number,
  infermiereId: number,
): ApiDataResponse<AssegnazioneTurno> {
  const body: components['schemas']['AssegnazioneTurnoCreate'] = {
    infermiere_id: infermiereId,
  }

  const result = await eiraClient.POST('/api/v1/turni/{turno_id}/assegnazioni', {
    params: {
      path: {
        turno_id: turnoId,
      },
    },
    body,
  })

  return unwrapData(result, 'assegnaTurno')
}
