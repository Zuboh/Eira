import apiClient from '@/api/client'

export type TipoTurno = 'mattina' | 'pomeriggio' | 'notte'
export type StatoAssegnazione = 'attiva' | 'cambiata'

export interface Turno {
  id: number
  data: string
  tipo: TipoTurno
  reparto_id: number
  ora_inizio: string
  ora_fine: string
}

export interface AssegnazioneTurno {
  id: number
  turno_id: number
  infermiere_id: number
  stato: StatoAssegnazione
}

export function getMieAssegnazioni() {
  return apiClient.get<AssegnazioneTurno[]>('/turni/mie-assegnazioni')
}

export function listTurni() {
  return apiClient.get<Turno[]>('/turni/')
}
