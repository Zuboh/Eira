import type { RuoloUtente, StatoUtente, Utente } from '@/api/utenti'

export type StaffFilterOption = {
  value: StatoUtente
  label: string
}

export type StaffFiltersProps = {
  options: StaffFilterOption[]
}

export type StaffTableProps = {
  utenti: Utente[]
  resetLoadingId: number | null
}

export type StaffTableEmits = {
  approve: [utente: Utente]
  resetPassword: [utente: Utente]
}

export type TemporaryPasswordNoticeProps = {
  password: string
}

export type TemporaryPasswordNoticeEmits = {
  copy: []
}

export type NewStaffForm = {
  nome: string
  cognome: string
  email: string
  password: string
  ruolo: RuoloUtente
}

export type NewStaffDialogProps = {
  saving: boolean
}

export type StaffDialogEmits = {
  save: []
}
