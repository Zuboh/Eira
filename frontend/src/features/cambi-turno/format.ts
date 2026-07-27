import type { RichiestaCambioTurno } from '@/api/cambiTurno'
import type { Turno } from '@/api/turni'
import { TIPO_TURNO_LABEL } from '@/features/turni/constants'
import { formatDateShortIt } from '@/utils/dateFormat'

export function formatTurnoCambio(turno: Turno) {
  return `${formatDateShortIt(turno.data)} · ${TIPO_TURNO_LABEL[turno.tipo]}`
}

export function formatCambioRichiesto(richiesta: RichiestaCambioTurno) {
  const turnoRichiedente = formatTurnoCambio(richiesta.turno_richiedente)
  return richiesta.turno_collega
    ? `${turnoRichiedente} → ${formatTurnoCambio(richiesta.turno_collega)}`
    : turnoRichiedente
}
