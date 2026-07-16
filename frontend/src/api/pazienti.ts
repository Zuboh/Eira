import apiClient from '@/api/client'

export interface Paziente {
  id: number
  nome: string
  cognome: string
  eta: number
  letto: string
  data_ricovero: string
  diagnosi_ingresso: string
  reparto_id: number
  dimesso: boolean
}

export interface PazienteCreatePayload {
  nome: string
  cognome: string
  eta: number
  letto: string
  data_ricovero: string
  diagnosi_ingresso: string
  reparto_id: number
}

export interface PazienteUpdatePayload {
  letto?: string
  diagnosi_ingresso?: string
  dimesso?: boolean
}

export function listPazienti() {
  return apiClient.get<Paziente[]>('/pazienti/')
}

export function getPaziente(id: number) {
  return apiClient.get<Paziente>(`/pazienti/${id}`)
}

export function createPaziente(payload: PazienteCreatePayload) {
  return apiClient.post<Paziente>('/pazienti/', payload)
}

export function updatePaziente(id: number, payload: PazienteUpdatePayload) {
  return apiClient.patch<Paziente>(`/pazienti/${id}`, payload)
}
