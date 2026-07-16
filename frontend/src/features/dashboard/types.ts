import type { Turno, TurnoCalendario } from '@/api/turni'

export type CalendarioCella = {
  tipo: Turno['tipo']
  turno: TurnoCalendario | null
  assegnati: string
}

export type CalendarioRiga = {
  data: string
  celle: CalendarioCella[]
}
