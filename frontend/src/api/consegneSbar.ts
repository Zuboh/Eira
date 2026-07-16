import apiClient from '@/api/client'

export type PrioritaConsegna = 'normale' | 'urgente'

export interface ConsegnaSbar {
  id: number
  paziente_id: number
  turno_id: number
  autore_id: number
  situation: string
  background: string
  assessment: string
  recommendation: string
  priorita: PrioritaConsegna
  creata_il: string
}

export interface ConsegnaSbarCreatePayload {
  paziente_id: number
  turno_id: number
  situation: string
  background: string
  assessment: string
  recommendation: string
  priorita: PrioritaConsegna
}

export interface ConsegnaSbarUpdatePayload {
  situation?: string
  background?: string
  assessment?: string
  recommendation?: string
  priorita?: PrioritaConsegna
}

export function listConsegneSbar() {
  return apiClient.get<ConsegnaSbar[]>('/consegne-sbar/')
}

export function createConsegnaSbar(payload: ConsegnaSbarCreatePayload) {
  return apiClient.post<ConsegnaSbar>('/consegne-sbar/', payload)
}

export function updateConsegnaSbar(id: number, payload: ConsegnaSbarUpdatePayload) {
  return apiClient.patch<ConsegnaSbar>(`/consegne-sbar/${id}`, payload)
}
