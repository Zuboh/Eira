import { eiraClient } from '@/api/eiraClient'
import type { components } from '@/api/schema'

export type StatoCambioTurno = components['schemas']['StatoCambioTurno']

type RichiestaCambioTurnoRead = components['schemas']['RichiestaCambioTurnoRead']

type NullableResponseFields =
  | 'risposta_collega_il'
  | 'risposta_caposala_id'
  | 'risposta_caposala_il'
  | 'motivo_rifiuto'

export type RichiestaCambioTurno = Omit<RichiestaCambioTurnoRead, NullableResponseFields> &
  Required<Pick<RichiestaCambioTurnoRead, NullableResponseFields>>

export type RichiestaCambioTurnoCreatePayload =
  components['schemas']['RichiestaCambioTurnoCreate']

export type RispostaCollegaPayload = components['schemas']['RispostaCollegaRequest']
export type RispostaCaposalaPayload = components['schemas']['RispostaCaposalaRequest']

type ApiDataResponse<T> = Promise<{ data: T }>

type EiraResult<T> = {
  data?: T
  error?: unknown
}

function formatApiError(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  try {
    return JSON.stringify(error)
  } catch {
    return 'Unknown API error'
  }
}

function unwrapData<T>(result: EiraResult<T>, operation: string): T {
  if (result.error !== undefined) {
    throw new Error(`${operation} failed: ${formatApiError(result.error)}`)
  }

  if (result.data === undefined) {
    throw new Error(`${operation} failed: response data is undefined`)
  }

  return result.data
}

export function normalizeRichiestaCambioTurno(
  richiesta: RichiestaCambioTurnoRead,
): RichiestaCambioTurno {
  return {
    ...richiesta,
    risposta_collega_il: richiesta.risposta_collega_il ?? null,
    risposta_caposala_id: richiesta.risposta_caposala_id ?? null,
    risposta_caposala_il: richiesta.risposta_caposala_il ?? null,
    motivo_rifiuto: richiesta.motivo_rifiuto ?? null,
  }
}

function wrapRichiestaCambioTurno(
  richiesta: RichiestaCambioTurnoRead,
): { data: RichiestaCambioTurno } {
  return { data: normalizeRichiestaCambioTurno(richiesta) }
}

export async function listCambiTurno(): ApiDataResponse<RichiestaCambioTurno[]> {
  const data = unwrapData(await eiraClient.GET('/api/v1/cambi-turno/'), 'listCambiTurno')

  return { data: data.map(normalizeRichiestaCambioTurno) }
}

export async function createRichiestaCambioTurno(
  payload: RichiestaCambioTurnoCreatePayload,
): ApiDataResponse<RichiestaCambioTurno> {
  const data = unwrapData(
    await eiraClient.POST('/api/v1/cambi-turno/', {
      body: payload,
    }),
    'createRichiestaCambioTurno',
  )

  return wrapRichiestaCambioTurno(data)
}

export async function rispondiCollega(
  id: number,
  payload: RispostaCollegaPayload,
): ApiDataResponse<RichiestaCambioTurno> {
  const data = unwrapData(
    await eiraClient.POST('/api/v1/cambi-turno/{richiesta_id}/risposta-collega', {
      params: {
        path: {
          richiesta_id: id,
        },
      },
      body: payload,
    }),
    'rispondiCollega',
  )

  return wrapRichiestaCambioTurno(data)
}

export async function rispondiCaposala(
  id: number,
  payload: RispostaCaposalaPayload,
): ApiDataResponse<RichiestaCambioTurno> {
  const data = unwrapData(
    await eiraClient.POST('/api/v1/cambi-turno/{richiesta_id}/risposta-caposala', {
      params: {
        path: {
          richiesta_id: id,
        },
      },
      body: payload,
    }),
    'rispondiCaposala',
  )

  return wrapRichiestaCambioTurno(data)
}

export async function deleteCambioTurno(id: number): Promise<void> {
  const { error } = await eiraClient.DELETE('/api/v1/cambi-turno/{richiesta_id}', {
    params: { path: { richiesta_id: id } },
  })

  if (error !== undefined) {
    throw new Error(`deleteCambioTurno failed: ${formatApiError(error)}`)
  }
}
