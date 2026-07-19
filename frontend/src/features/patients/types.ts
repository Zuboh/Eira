import type { Paziente, PazienteCreatePayload } from '@/api/pazienti'

export type NewPatientForm = Omit<
  PazienteCreatePayload,
  'reparto_id' | 'data_ricovero' | 'eta'
> & {
  eta: number | null
  data_ricovero: Date
}

export type PatientsTableProps = {
  patients: Paziente[]
  loading: boolean
}

export type NewPatientDialogProps = {
  saving: boolean
}

export type PatientDialogEmits = {
  save: []
}
