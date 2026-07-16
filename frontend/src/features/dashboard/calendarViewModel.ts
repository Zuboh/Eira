import type { Turno, TurnoCalendario } from '@/api/turni'
import { TIPI_TURNO } from '@/features/turni/constants'
import type { CalendarioRiga } from '@/features/dashboard/types'

export function buildCalendarioRows(
  calendario: TurnoCalendario[],
  resolveInfermiereName: (infermiereId: number) => string,
): CalendarioRiga[] {
  const turniByData = new Map<string, Partial<Record<Turno['tipo'], TurnoCalendario>>>()

  for (const turno of calendario) {
    const turni = turniByData.get(turno.data) ?? {}
    turni[turno.tipo] = turno
    turniByData.set(turno.data, turni)
  }

  return [...turniByData.entries()]
    .sort(([dataA], [dataB]) => dataA.localeCompare(dataB))
    .map(([data, turni]) => ({
      data,
      celle: TIPI_TURNO.map((tipo) => {
        const turno = turni[tipo] ?? null

        return {
          tipo,
          turno,
          assegnati: turno
            ? turno.assegnazioni.map((a) => resolveInfermiereName(a.infermiere_id)).join(', ')
            : '',
        }
      }),
    }))
}
