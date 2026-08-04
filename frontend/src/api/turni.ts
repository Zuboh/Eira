import { eiraClient } from '@/api/eiraClient'
import { unwrapData } from '@/api/apiError'
import type { components } from '@/api/schema'

export type TipoTurno = components['schemas']['TipoTurno']
export type StatoAssegnazione = components['schemas']['StatoAssegnazione']
export type Turno = components['schemas']['TurnoRead']
export type AssegnazioneTurno = components['schemas']['AssegnazioneTurnoRead']
export type TurnoCalendario = components['schemas']['TurnoCalendarioRead']
export type ProssimoTurnoConColleghi =
  components['schemas']['ProssimoTurnoConColleghiRead']

type ApiDataResponse<T> = Promise<{ data: T }>

export async function getMieAssegnazioni(): ApiDataResponse<
  AssegnazioneTurno[]
> {
  const result = await eiraClient.GET('/api/v1/turni/mie-assegnazioni')

  return unwrapData(result, 'getMieAssegnazioni')
}

export async function getAssegnazioniScambiabili(): ApiDataResponse<
  AssegnazioneTurno[]
> {
  const result = await eiraClient.GET('/api/v1/turni/assegnazioni-scambiabili')

  return unwrapData(result, 'getAssegnazioniScambiabili')
}

export async function getMieiProssimiTurni(
  params: { limit?: number } = {},
): ApiDataResponse<ProssimoTurnoConColleghi[]> {
  const result = await eiraClient.GET('/api/v1/turni/miei-prossimi-turni', {
    params: { query: params },
  })

  return unwrapData(result, 'getMieiProssimiTurni')
}

export async function listTurni(): ApiDataResponse<Turno[]> {
  const result = await eiraClient.GET('/api/v1/turni/')

  return unwrapData(result, 'listTurni')
}

export async function getCalendarioTurni(
  params: { da?: string; a?: string } = {},
): ApiDataResponse<TurnoCalendario[]> {
  const result = await eiraClient.GET('/api/v1/turni/calendario', {
    params: { query: params },
  })

  return unwrapData(result, 'getCalendarioTurni')
}

export async function assegnaTurno(
  turnoId: number,
  infermiereId: number,
): ApiDataResponse<AssegnazioneTurno> {
  const body: components['schemas']['AssegnazioneTurnoCreate'] = {
    infermiere_id: infermiereId,
  }

  const result = await eiraClient.POST(
    '/api/v1/turni/{turno_id}/assegnazioni',
    {
      params: {
        path: {
          turno_id: turnoId,
        },
      },
      body,
    },
  )

  return unwrapData(result, 'assegnaTurno')
}
