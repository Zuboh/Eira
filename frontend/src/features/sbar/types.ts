import type {
  ConsegnaSbar,
  ConsegnaSbarCreatePayload,
  ConsegnaSbarUpdatePayload,
  PrioritaConsegna,
} from '@/api/consegneSbar'
import type { Paziente } from '@/api/pazienti'
import type { AssegnazioneTurno } from '@/api/turni'

export type {
  ConsegnaSbar,
  ConsegnaSbarCreatePayload,
  ConsegnaSbarUpdatePayload,
  PrioritaConsegna,
  Paziente,
  AssegnazioneTurno,
}

export type ConsegnaSbarForm = {
  paziente_id: number | null
  turno_id: number | null
  situation: string
  background: string
  assessment: string
  recommendation: string
  priorita: PrioritaConsegna
}

export type PrioritaOption = {
  value: PrioritaConsegna
  label: string
}

export type SbarFormErrors = Partial<Record<keyof ConsegnaSbarForm, string>>
