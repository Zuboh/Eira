import { eiraClient } from '@/api/eiraClient'
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

function unwrapData<T>(result: EiraResult<T>, operation: string): { data: T } {
  if (result.error !== undefined) {
    throw new Error(`${operation} failed: ${formatApiError(result.error)}`)
  }

  if (result.data === undefined) {
    throw new Error(`${operation} failed: response data is undefined`)
  }

  return { data: result.data }
}

export async function getDashboardCaposala(): Promise<{
  data: DashboardCaposala
}> {
  const result = await eiraClient.GET('/api/v1/dashboard/caposala')
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
