import type { PazienteUpdatePayload } from '@/api/pazienti'
import type { AssegnazioneTurno } from '@/api/turni'
import type { ConsegnaSbar } from '@/api/consegneSbar'
import type {
  VoceDiarioCedema,
  VoceDiarioCedemaCreatePayload,
} from '@/api/diarioCedema'
import type {
  ValutazioneConley,
  ValutazioneConleyCreatePayload,
  ValutazioneNorton,
  ValutazioneNortonCreatePayload,
} from '@/api/valutazioni'

export type CedemaForm = VoceDiarioCedemaCreatePayload
export type NortonForm = ValutazioneNortonCreatePayload
export type ConleyForm = ValutazioneConleyCreatePayload
export type PatientEditForm = Required<
  Pick<PazienteUpdatePayload, 'letto' | 'diagnosi_ingresso' | 'dimesso'>
>

export type PatientChartSaveEmit = {
  save: []
}

export type CedemaDialogProps = {
  assegnazioni: AssegnazioneTurno[]
  saving: boolean
}

export type ValutazioneDialogProps = {
  saving: boolean
}

export type CedemaTabProps = {
  entries: VoceDiarioCedema[]
  canCreate: boolean
}

export type CedemaTabEmits = {
  newEntry: []
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

export type StoricoSbarTabProps = {
  consegne: ConsegnaSbar[]
  loading: boolean
}
