import type { EventInput } from '@fullcalendar/core'
import type { ProssimoTurnoConColleghi } from '@/api/turni'
import { TIPO_TURNO_LABEL } from '@/features/turni/constants'

export type TurnoCalendarEventProps = {
  data: string
  tipoLabel: string
  orario: string
  colleghi: string[]
  isLavorativo: boolean
}

const TIPI_NON_LAVORATIVI = new Set(['riposo', 'ferie', 'ferie_estive'])

function nomeCollega(collega: ProssimoTurnoConColleghi['colleghi'][number]) {
  return `${collega.cognome} ${collega.nome}`
}

export function buildTurniEvents(
  turniConColleghi: ProssimoTurnoConColleghi[],
): EventInput[] {
  return turniConColleghi.map((entry) => {
    const turno = entry.turno
    const classeTipo = turno.tipo === 'ferie_estive' ? 'ferie' : turno.tipo
    const tipoLabel = TIPO_TURNO_LABEL[turno.tipo]

    return {
      id: String(turno.id),
      title: tipoLabel,
      start: turno.data,
      classNames: [`turno-${classeTipo}`],
      extendedProps: {
        data: turno.data,
        tipoLabel,
        orario: `${turno.ora_inizio.slice(0, 5)}–${turno.ora_fine.slice(0, 5)}`,
        colleghi: entry.colleghi.map(nomeCollega),
        isLavorativo: !TIPI_NON_LAVORATIVI.has(turno.tipo),
      } satisfies TurnoCalendarEventProps,
    }
  })
}
