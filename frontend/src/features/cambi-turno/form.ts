import type { RichiestaCambioTurnoCreatePayload } from '@/api/cambiTurno'
import type { CambioTurnoForm } from '@/features/cambi-turno/types'

export function createEmptyCambioTurnoForm(): CambioTurnoForm {
  return {
    assegnazione_turno_id: null,
    collega_id: null,
  }
}

export function toCambioTurnoCreatePayload(
  form: CambioTurnoForm,
): RichiestaCambioTurnoCreatePayload | null {
  if (!form.assegnazione_turno_id || !form.collega_id) return null

  return {
    assegnazione_turno_id: form.assegnazione_turno_id,
    collega_id: form.collega_id,
  }
}
