import { eiraClient } from '@/api/eiraClient'
import { unwrapData } from '@/api/apiError'
import type { components } from '@/api/schema'

export type Reparto = components['schemas']['RepartoRead']
export type UtenteTile = components['schemas']['UtenteTile']
export type TurnoOggi = components['schemas']['TurnoOggiRead']

type ApiDataResponse<T> = Promise<{ data: T }>

export async function listReparti(): ApiDataResponse<Reparto[]> {
  const result = await eiraClient.GET('/api/v1/reparti/')

  return unwrapData(result, 'listReparti')
}

export async function listUtentiByReparto(
  id: number,
): ApiDataResponse<UtenteTile[]> {
  const result = await eiraClient.GET('/api/v1/reparti/{reparto_id}/utenti', {
    params: {
      path: {
        reparto_id: id,
      },
    },
  })

  return unwrapData(result, 'listUtentiByReparto')
}

export async function getTurnoOggiUtente(
  repartoId: number,
  utenteId: number,
): ApiDataResponse<TurnoOggi | null> {
  const result = await eiraClient.GET(
    '/api/v1/reparti/{reparto_id}/utenti/{utente_id}/turno-oggi',
    {
      params: {
        path: {
          reparto_id: repartoId,
          utente_id: utenteId,
        },
      },
    },
  )

  return unwrapData(result, 'getTurnoOggiUtente')
}
