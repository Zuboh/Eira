import apiClient from '@/api/client'

export interface VoceDiarioCedema {
  id: number
  paziente_id: number
  autore_id: number
  turno_id: number | null
  coscienza: string
  emotivita: string
  dolore: string
  emodinamica: string
  mobilizzazione: string
  allert: string
  timestamp: string
}

export interface VoceDiarioCedemaCreatePayload {
  turno_id?: number | null
  coscienza: string
  emotivita: string
  dolore: string
  emodinamica: string
  mobilizzazione: string
  allert: string
}

export function listDiarioCedema(pazienteId: number) {
  return apiClient.get<VoceDiarioCedema[]>(`/pazienti/${pazienteId}/diario-cedema`)
}

export function createVoceDiarioCedema(
  pazienteId: number,
  payload: VoceDiarioCedemaCreatePayload,
) {
  return apiClient.post<VoceDiarioCedema>(`/pazienti/${pazienteId}/diario-cedema`, payload)
}
