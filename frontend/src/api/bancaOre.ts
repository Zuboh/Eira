import apiClient from '@/api/client'

export interface BancaOre {
  infermiere_id: number
  mese: string
  ore_pianificate: number
  ore_contrattuali: number
  saldo: number
}

export function getBancaOre(infermiereId: number, mese: string) {
  return apiClient.get<BancaOre>(`/banca-ore/${infermiereId}`, { params: { mese } })
}
