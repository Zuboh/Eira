import type { EventInput } from '@fullcalendar/core'
import type { AssegnazioneTurno, Turno } from '@/api/turni'
import { TIPO_TURNO_LABEL } from '@/features/turni/constants'

export function buildTurniEvents(
  assegnazioni: AssegnazioneTurno[],
  turni: Turno[],
): EventInput[] {
  const turniById = new Map(turni.map((turno) => [turno.id, turno]))

  return assegnazioni
    .filter((assegnazione) => assegnazione.stato === 'attiva')
    .map((assegnazione) => turniById.get(assegnazione.turno_id))
    .filter((turno): turno is Turno => turno !== undefined)
    .map((turno) => {
      const classeTipo = turno.tipo === 'ferie_estive' ? 'ferie' : turno.tipo
      return {
        id: String(turno.id),
        title: TIPO_TURNO_LABEL[turno.tipo],
        start: turno.data,
        classNames: [`turno-${classeTipo}`],
      }
    })
}
