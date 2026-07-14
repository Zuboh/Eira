import apiClient from '@/api/client'

export interface Reparto {
  id: number
  nome: string
}

export interface UtenteTile {
  id: number
  nome: string
  cognome: string
  ruolo: 'infermiere' | 'caposala'
}

export function listReparti() {
  return apiClient.get<Reparto[]>('/reparti')
}

export function listUtentiByReparto(id: number) {
  return apiClient.get<UtenteTile[]>(`/reparti/${id}/utenti`)
}
