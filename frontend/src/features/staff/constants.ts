import type { RuoloUtente } from '@/api/utenti'

export const RUOLO_LABEL: Record<RuoloUtente, string> = {
  infermiere: 'Infermiere',
  caposala: 'Caposala',
}

export const ruoloOptions: { value: RuoloUtente; label: string }[] = [
  { value: 'infermiere', label: RUOLO_LABEL.infermiere },
  { value: 'caposala', label: RUOLO_LABEL.caposala },
]
