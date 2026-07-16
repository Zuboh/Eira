import type { PazienteCreatePayload } from '@/api/pazienti'
import type { NewPatientForm } from '@/features/patients/types'

export function createEmptyNewPatientForm(): NewPatientForm {
  return {
    nome: '',
    cognome: '',
    eta: null,
    letto: '',
    data_ricovero: new Date(),
    diagnosi_ingresso: '',
  }
}

export function toPatientCreatePayload(
  form: NewPatientForm,
  repartoId: number,
): PazienteCreatePayload | null {
  if (!form.eta) return null

  return {
    nome: form.nome,
    cognome: form.cognome,
    eta: form.eta,
    letto: form.letto,
    data_ricovero: form.data_ricovero.toISOString().slice(0, 10),
    diagnosi_ingresso: form.diagnosi_ingresso,
    reparto_id: repartoId,
  }
}
