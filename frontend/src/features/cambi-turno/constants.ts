import type { StatoCambioTurno } from '@/api/cambiTurno'

export const STATO_CAMBIO_TURNO_LABEL: Record<StatoCambioTurno, string> = {
  in_attesa_collega: 'In attesa del collega',
  rifiutata_collega: 'Rifiutata dal collega',
  in_attesa_caposala: 'In attesa di approvazione',
  rifiutata_caposala: 'Rifiutata',
  approvata: 'Approvata',
}
