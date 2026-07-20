import type { CarelloFarmaco } from '@/api/carelloFarmaci'
import type { ConsegnaSbar } from '@/api/consegneSbar'
import type { Paziente } from '@/api/pazienti'
import type {
  ProssimoTurnoConColleghi,
  Turno,
  TurnoCalendario,
} from '@/api/turni'

export type CalendarioCella = {
  tipo: Turno['tipo']
  turno: TurnoCalendario | null
  assegnati: string
  assegnatiCount: number
  sottoCopertura: boolean
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
  turni: ProssimoTurnoConColleghi[]
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
