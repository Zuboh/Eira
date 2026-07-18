import type { RichiestaCambioTurno, RichiestaCambioTurnoCreatePayload } from '@/api/cambiTurno'
import type { AssegnazioneTurno } from '@/api/turni'
import type { Utente } from '@/api/utenti'

export type CambioTurnoForm = {
  assegnazione_turno_id: RichiestaCambioTurnoCreatePayload['assegnazione_turno_id'] | null
  collega_id: RichiestaCambioTurnoCreatePayload['collega_id'] | null
}

export type UserRole = Utente['ruolo'] | null

export type CambiTurnoTableProps = {
  richieste: RichiestaCambioTurno[]
  currentUserId: number | null
  currentRole: UserRole
  nomeUtente: (id: number) => string
}

export type CambiTurnoTableEmits = {
  colleagueResponse: [richiesta: RichiestaCambioTurno, accetta: boolean]
  approve: [richiesta: RichiestaCambioTurno]
  reject: [richiesta: RichiestaCambioTurno]
  cancel: [richiesta: RichiestaCambioTurno]
}

export type NewCambioTurnoDialogProps = {
  assegnazioni: AssegnazioneTurno[]
  colleghi: Utente[]
  saving: boolean
}

export type RifiutoCambioTurnoDialogProps = {
  saving?: boolean
}

export type CambioTurnoSubmitEmits = {
  save: []
}
