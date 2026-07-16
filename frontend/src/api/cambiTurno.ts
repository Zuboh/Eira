import apiClient from '@/api/client'

export type StatoCambioTurno =
  | 'in_attesa_collega'
  | 'rifiutata_collega'
  | 'in_attesa_caposala'
  | 'rifiutata_caposala'
  | 'approvata'

export interface RichiestaCambioTurno {
  id: number
  assegnazione_turno_id: number
  richiedente_id: number
  collega_id: number
  stato: StatoCambioTurno
  creata_il: string
  risposta_collega_il: string | null
  risposta_caposala_id: number | null
  risposta_caposala_il: string | null
  motivo_rifiuto: string | null
}

export interface RichiestaCambioTurnoCreatePayload {
  assegnazione_turno_id: number
  collega_id: number
}

export interface RispostaCollegaPayload {
  accetta: boolean
}

export interface RispostaCaposalaPayload {
  accetta: boolean
  motivo_rifiuto?: string
}

export function listCambiTurno() {
  return apiClient.get<RichiestaCambioTurno[]>('/cambi-turno/')
}

export function createRichiestaCambioTurno(payload: RichiestaCambioTurnoCreatePayload) {
  return apiClient.post<RichiestaCambioTurno>('/cambi-turno/', payload)
}

export function rispondiCollega(id: number, payload: RispostaCollegaPayload) {
  return apiClient.post<RichiestaCambioTurno>(`/cambi-turno/${id}/risposta-collega`, payload)
}

export function rispondiCaposala(id: number, payload: RispostaCaposalaPayload) {
  return apiClient.post<RichiestaCambioTurno>(`/cambi-turno/${id}/risposta-caposala`, payload)
}
