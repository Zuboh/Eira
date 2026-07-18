import type { Turno } from '@/api/turni'

export const TIPO_TURNO_LABEL: Record<Turno['tipo'], string> = {
  mattina: 'Mattina',
  pomeriggio: 'Pomeriggio',
  notte: 'Notte',
  riposo: 'Riposo',
  ferie: 'Ferie',
  ferie_estive: 'Ferie estive',
}

export const TIPI_TURNO = [
  'mattina',
  'pomeriggio',
  'notte',
  'riposo',
  'ferie',
  'ferie_estive',
] as const satisfies Turno['tipo'][]
