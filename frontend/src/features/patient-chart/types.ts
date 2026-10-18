import type { PazienteUpdatePayload } from '@/api/pazienti'
import type { PrioritaConsegna } from '@/api/consegneSbar'
import type { Paziente } from '@/api/pazienti'
import type { AssegnazioneTurnoOption } from '@/features/sbar/turnoOptions'
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

export type GenericConsegnaKind = 'sbar' | 'soapie'

export type GenericConsegnaForm = {
  paziente_id: number | null
  tipo: GenericConsegnaKind
  data: string | null
  turno_id: number | null
  priorita: PrioritaConsegna
  testo: string
}

export type ClinicalTimelineEntry = {
  id: string
  sourceId: number
  tipo: GenericConsegnaKind
  timestamp: string
  autoreId: number
  title: string
  sections: { label: string; value: string }[]
  priorita?: PrioritaConsegna
}

export type PatientChartSaveEmit = {
  save: []
}

export type ClinicalTimelineTabProps = {
  nomeAutore: (id: number) => string
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
  isEditing?: boolean
  saving: boolean
  copiedKeys?: string[]
  canCopyForward?: boolean
  copyForwardLoading?: boolean
  /**
   * Errore del form. Vive dentro il dialog: renderizzato dalla vista sarebbe
   * coperto dalla mask modale e il salvataggio sembrerebbe non fare nulla.
   */
  error?: string
}

export type GenericConsegnaDialogEmits = {
  save: []
  copyForward: []
  copyForwardSection: [key: string]
}

export type ParametriVitaliDialogProps = {
  error?: string
  saving: boolean
}

export type ValutazioneDialogProps = {
  error?: string
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

export type StatoCoscienzaOption = {
  value: StatoCoscienza
  label: string
}
