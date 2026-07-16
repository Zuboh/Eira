import apiClient from '@/api/client'
import type { RichiestaCambioTurno } from '@/api/cambiTurno'
import type { Turno } from '@/api/turni'

export interface DashboardCaposala {
  turni_scoperti: Turno[]
  turni_scoperti_count: number
  cambi_turno_in_attesa: RichiestaCambioTurno[]
  cambi_turno_in_attesa_count: number
}

export function getDashboardCaposala() {
  return apiClient.get<DashboardCaposala>('/dashboard/caposala')
}
