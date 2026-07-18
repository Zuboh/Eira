import { eiraClient } from '@/api/eiraClient'
import type { components } from '@/api/schema'

export type StatoRichiestaFerie = components['schemas']['StatoRichiestaFerie']

type RichiestaFerieRead = components['schemas']['RichiestaFerieRead']

type NullableResponseFields = 'risposta_caposala_id' | 'risposta_caposala_il' | 'motivo_rifiuto'

export type RichiestaFerie = Omit<RichiestaFerieRead, NullableResponseFields> &
  Required<Pick<RichiestaFerieRead, NullableResponseFields>>

export type RichiestaFerieCreatePayload = components['schemas']['RichiestaFerieCreate']
export type RispostaFeriePayload = components['schemas']['RispostaFerieRequest']

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

function normalizeRichiestaFerie(richiesta: RichiestaFerieRead): RichiestaFerie {
  return {
    ...richiesta,
    risposta_caposala_id: richiesta.risposta_caposala_id ?? null,
    risposta_caposala_il: richiesta.risposta_caposala_il ?? null,
    motivo_rifiuto: richiesta.motivo_rifiuto ?? null,
  }
}

function wrapRichiestaFerie(richiesta: RichiestaFerieRead): { data: RichiestaFerie } {
  return { data: normalizeRichiestaFerie(richiesta) }
}

export async function listSlotFerieDisponibili(): ApiDataResponse<string[]> {
  const data = unwrapData(
    await eiraClient.GET('/api/v1/ferie/slot-disponibili'),
    'listSlotFerieDisponibili',
  )

  return { data }
}

export async function listRichiesteFerie(): ApiDataResponse<RichiestaFerie[]> {
  const data = unwrapData(await eiraClient.GET('/api/v1/ferie/richieste'), 'listRichiesteFerie')

  return { data: data.map(normalizeRichiestaFerie) }
}

export async function createRichiestaFerie(
  payload: RichiestaFerieCreatePayload,
): ApiDataResponse<RichiestaFerie> {
  const data = unwrapData(
    await eiraClient.POST('/api/v1/ferie/richieste', { body: payload }),
    'createRichiestaFerie',
  )

  return wrapRichiestaFerie(data)
}

export async function rispondiFerie(
  id: number,
  payload: RispostaFeriePayload,
): ApiDataResponse<RichiestaFerie> {
  const data = unwrapData(
    await eiraClient.POST('/api/v1/ferie/richieste/{richiesta_id}/rispondi', {
      params: { path: { richiesta_id: id } },
      body: payload,
    }),
    'rispondiFerie',
  )

  return wrapRichiestaFerie(data)
}

export async function updateRichiestaFerie(
  id: number,
  payload: RichiestaFerieCreatePayload,
): ApiDataResponse<RichiestaFerie> {
  const data = unwrapData(
    await eiraClient.PATCH('/api/v1/ferie/richieste/{richiesta_id}', {
      params: { path: { richiesta_id: id } },
      body: payload,
    }),
    'updateRichiestaFerie',
  )

  return wrapRichiestaFerie(data)
}

export async function deleteRichiestaFerie(id: number): Promise<void> {
  const { error } = await eiraClient.DELETE('/api/v1/ferie/richieste/{richiesta_id}', {
    params: { path: { richiesta_id: id } },
  })

  if (error !== undefined) {
    throw new Error(`deleteRichiestaFerie failed: ${formatApiError(error)}`)
  }
}
