import { eiraClient } from '@/api/eiraClient'
import type { components } from '@/api/schema'

export type BancaOre = components['schemas']['BancaOreRead']

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'Errore nel recupero della banca ore'
}

export async function getBancaOre(
  infermiereId: number,
  mese: string,
): Promise<{ data: BancaOre }> {
  const { data, error } = await eiraClient.GET('/api/v1/banca-ore/{infermiere_id}', {
    params: {
      path: { infermiere_id: infermiereId },
      query: { mese },
    },
  })

  if (error) {
    throw new Error(getErrorMessage(error))
  }

  if (data === undefined) {
    throw new Error('Risposta banca ore vuota')
  }

  return { data }
}
