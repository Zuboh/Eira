import { eiraClient } from '@/api/eiraClient'
import { unwrapData } from '@/api/apiError'
import type { components } from '@/api/schema'

export type StatoUtente = components['schemas']['StatoUtente']
export type Utente = components['schemas']['UtenteRead']
export type RuoloUtente = components['schemas']['RuoloUtente']
export type UtenteCreatePayload = components['schemas']['UtenteCreate']

type TemporaryPasswordResponse =
  components['schemas']['TemporaryPasswordResponse']
type UpdateUtentePayload = Partial<Pick<Utente, 'stato'>>
type ApiResponse<T> = Promise<{ data: T }>

export async function createUtente(
  payload: UtenteCreatePayload,
): ApiResponse<Utente> {
  const result = await eiraClient.POST('/api/v1/utenti/', {
    body: payload,
  })

  return unwrapData(result, 'createUtente')
}

export async function listUtenti(): ApiResponse<Utente[]> {
  const result = await eiraClient.GET('/api/v1/utenti/')

  return unwrapData(result, 'listUtenti')
}

export async function updateUtente(
  id: number,
  payload: UpdateUtentePayload,
): ApiResponse<Utente> {
  const result = await eiraClient.PATCH('/api/v1/utenti/{utente_id}', {
    params: {
      path: {
        utente_id: id,
      },
    },
    body: payload,
  })

  return unwrapData(result, 'updateUtente')
}

export async function uploadAvatar(
  id: number,
  file: File,
): ApiResponse<Utente> {
  const body = new FormData()
  body.append('file', file)
  const result = await eiraClient.POST('/api/v1/utenti/{utente_id}/avatar', {
    params: {
      path: {
        utente_id: id,
      },
    },
    // openapi-typescript generates the multipart body as { file: string }
    // (no native Blob/File type for binary form fields) — the actual
    // request is a real FormData with a File, cast to satisfy the type.
    body: body as unknown as { file: string },
  })

  return unwrapData(result, 'uploadAvatar')
}

export async function createTemporaryPassword(
  id: number,
): ApiResponse<TemporaryPasswordResponse> {
  const result = await eiraClient.POST(
    '/api/v1/utenti/{utente_id}/password-temporanea',
    {
      params: {
        path: {
          utente_id: id,
        },
      },
    },
  )

  return unwrapData(result, 'createTemporaryPassword')
}
