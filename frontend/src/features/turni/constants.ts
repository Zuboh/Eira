import type { Turno } from '@/api/turni'

export const TIPO_TURNO_LABEL: Record<Turno['tipo'], string> = {
  mattina: 'Mattina',
  pomeriggio: 'Pomeriggio',
  notte: 'Notte',
}

export const TIPI_TURNO = ['mattina', 'pomeriggio', 'notte'] as const satisfies Turno['tipo'][]
