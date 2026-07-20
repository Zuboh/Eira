import type { PazienteUpdatePayload } from '@/api/pazienti'
import type { ConsegnaSbar, PrioritaConsegna } from '@/api/consegneSbar'
import type { Paziente } from '@/api/pazienti'
import type { AssegnazioneTurnoOption } from '@/features/sbar/turnoOptions'
import type { VoceDiarioCedema } from '@/api/diarioCedema'
import type {
  ParametriVitali,
  ParametriVitaliCreatePayload,
  StatoCoscienza,
} from '@/api/parametriVitali'
import type {
  ValutazioneConley,
  ValutazioneConleyCreatePayload,
  ValutazioneNorton,
  ValutazioneNortonCreatePayload,
} from '@/api/valutazioni'

export type NortonForm = ValutazioneNortonCreatePayload
export type ConleyForm = ValutazioneConleyCreatePayload
export type ParametriVitaliForm = ParametriVitaliCreatePayload
export type PatientEditForm = Required<
  Pick<PazienteUpdatePayload, 'letto' | 'diagnosi_ingresso' | 'dimesso'>
>

export type GenericConsegnaKind = 'sbar' | 'cedema'

export type GenericConsegnaForm = {
  paziente_id: number | null
  tipo: GenericConsegnaKind
  data: string | null
  turno_id: number | null
  priorita: PrioritaConsegna
  testo: string
}

export type ClinicalInsight = {
  summary: string
  tags: string[]
}

export type ClinicalTimelineEntry = {
  id: string
  sourceId: number
  tipo: GenericConsegnaKind
  timestamp: string
  autoreId: number
  title: string
  body: string
  priorita?: PrioritaConsegna
}

export type PatientChartSaveEmit = {
  save: []
}

export type ClinicalTimelineTabProps = {
  entries: ClinicalTimelineEntry[]
  canCreate: boolean
}

export type ClinicalTimelineTabEmits = {
  newEntry: []
}

export type GenericConsegnaDialogProps = {
  assegnazioni: AssegnazioneTurnoOption[]
  pazienti?: Paziente[]
  hidePaziente?: boolean
  saving: boolean
  insight: ClinicalInsight | null
}

export type ParametriVitaliDialogProps = {
  saving: boolean
}

export type ValutazioneDialogProps = {
  saving: boolean
}

export type ValutazioniTabProps = {
  norton: ValutazioneNorton[]
  conley: ValutazioneConley[]
  canCreate: boolean
}

export type ValutazioniTabEmits = {
  newNorton: []
  newConley: []
}

export type ParametriVitaliTabProps = {
  entries: ParametriVitali[]
  canCreate: boolean
}

export type ParametriVitaliTabEmits = {
  newEntry: []
}

export type CedemaNarrativeSource = Pick<
  VoceDiarioCedema,
  | 'coscienza'
  | 'emotivita'
  | 'dolore'
  | 'emodinamica'
  | 'mobilizzazione'
  | 'allert'
>

export type SbarNarrativeSource = Pick<
  ConsegnaSbar,
  'situation' | 'background' | 'assessment' | 'recommendation'
>

export type StatoCoscienzaOption = {
  value: StatoCoscienza
  label: string
}
