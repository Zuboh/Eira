import { eiraClient } from '@/api/eiraClient'
import { unwrapData } from '@/api/apiError'
import {
  normalizeRichiestaCambioTurno,
  type RichiestaCambioTurno,
} from '@/api/cambiTurno'
import type { components } from '@/api/schema'

type DashboardCaposalaRead = components['schemas']['DashboardCaposala']

export type DashboardCaposala = Omit<
  DashboardCaposalaRead,
  'cambi_turno_in_attesa'
> & {
  cambi_turno_in_attesa: RichiestaCambioTurno[]
}

export async function getDashboardCaposala(
  params: { giorni?: number; limit?: number } = {},
): Promise<{
  data: DashboardCaposala
}> {
  const result = await eiraClient.GET('/api/v1/dashboard/caposala', {
    params: { query: params },
  })
  const { data } = unwrapData(result, 'getDashboardCaposala')

  return {
    data: {
      ...data,
      cambi_turno_in_attesa: data.cambi_turno_in_attesa.map(
        normalizeRichiestaCambioTurno,
      ),
    },
  }
}
