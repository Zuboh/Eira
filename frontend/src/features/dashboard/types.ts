import type { CarelloFarmaco } from '@/api/carelloFarmaci'
import type { ConsegnaSbar } from '@/api/consegneSbar'
import type { Paziente } from '@/api/pazienti'
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

export type DashboardInfermiereQuickLink = {
  label: string
  routeName: 'pazienti' | 'consegne-sbar' | 'carello-farmaci' | 'cambio-turno'
}

export type ProssimiTurniCardProps = {
  turni: Turno[]
  loading: boolean
}

export type ConsegneRecentiCardProps = {
  consegne: ConsegnaSbar[]
  loading: boolean
  nomePaziente: (pazienteId: number) => string
}

export type PazientiAttiviCardProps = {
  pazienti: Paziente[]
  loading: boolean
}

export type CarelloBassoStockCardProps = {
  farmaci: CarelloFarmaco[]
  loading: boolean
}
