import apiClient from '@/api/client'

export interface ValutazioneNortonCreatePayload {
  data_valutazione: string
  condizioni_generali: number
  stato_mentale: number
  attivita: number
  mobilita: number
  incontinenza: number
}

export interface ValutazioneNorton extends ValutazioneNortonCreatePayload {
  id: number
  paziente_id: number
  autore_id: number
  punteggio_totale: number
}

export interface ValutazioneConleyCreatePayload {
  data_valutazione: string
  storia_cadute: number
  deficit_visivo: number
  alterazione_eliminazione: number
  agitazione: number
  deficit_vista_osservato: number
  andatura_alterata: number
}

export interface ValutazioneConley extends ValutazioneConleyCreatePayload {
  id: number
  paziente_id: number
  autore_id: number
  punteggio_totale: number
}

export interface ValutazioniAggregate {
  norton: ValutazioneNorton[]
  conley: ValutazioneConley[]
}

export function getValutazioni(pazienteId: number) {
  return apiClient.get<ValutazioniAggregate>(`/pazienti/${pazienteId}/valutazioni`)
}

export function createNorton(pazienteId: number, payload: ValutazioneNortonCreatePayload) {
  return apiClient.post<ValutazioneNorton>(`/pazienti/${pazienteId}/norton`, payload)
}

export function createConley(pazienteId: number, payload: ValutazioneConleyCreatePayload) {
  return apiClient.post<ValutazioneConley>(`/pazienti/${pazienteId}/conley`, payload)
}
