import { eiraClient } from '@/api/eiraClient'
import { unwrapData } from '@/api/apiError'
import type { components } from '@/api/schema'

export type BancaOre = components['schemas']['BancaOreRead']

export async function getBancaOre(
  infermiereId: number,
  mese: string,
): Promise<{ data: BancaOre }> {
  const result = await eiraClient.GET('/api/v1/banca-ore/{infermiere_id}', {
    params: {
      path: { infermiere_id: infermiereId },
      query: { mese },
    },
  })

  return unwrapData(result, 'getBancaOre')
}
