import apiClient from '@/api/client'

export type StatoUtente = 'in_attesa' | 'attivo' | 'disattivato'

export interface Utente {
  id: number
  email: string
  nome: string
  cognome: string
  ruolo: 'infermiere' | 'caposala'
  reparto_id: number
  stato: StatoUtente
}

export function listUtenti() {
  return apiClient.get<Utente[]>('/utenti/')
}

export function updateUtente(id: number, payload: Partial<Pick<Utente, 'stato'>>) {
  return apiClient.patch<Utente>(`/utenti/${id}`, payload)
}

export function createTemporaryPassword(id: number) {
  return apiClient.post<{ temporary_password: string }>(`/utenti/${id}/password-temporanea`)
}
