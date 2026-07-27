import type { Turno, TurnoCalendario } from '@/api/turni'
import { TIPI_TURNO_LAVORATIVI } from '@/features/turni/constants'
import type { CalendarioRiga } from '@/features/dashboard/types'

const COPERTURA_MINIMA_TURNO = 1
const TIPI_LAVORATIVI_SET = new Set<Turno['tipo']>(TIPI_TURNO_LAVORATIVI)

function abbreviateName(name: string) {
  const [cognome, ...nomi] = name.trim().split(/\s+/)
  if (!cognome || nomi.length === 0) return name
  return `${cognome} ${nomi.map((nome) => `${nome.charAt(0)}.`).join(' ')}`
}

export function buildCalendarioRows(
  calendario: TurnoCalendario[],
  resolveInfermiereName: (infermiereId: number) => string,
): CalendarioRiga[] {
  const turniByData = new Map<
    string,
    Partial<Record<Turno['tipo'], TurnoCalendario>>
  >()

  for (const turno of calendario) {
    if (!TIPI_LAVORATIVI_SET.has(turno.tipo)) continue

    const turni = turniByData.get(turno.data) ?? {}
    turni[turno.tipo] = turno
    turniByData.set(turno.data, turni)
  }

  return [...turniByData.entries()]
    .sort(([dataA], [dataB]) => dataA.localeCompare(dataB))
    .map(([data, turni]) => ({
      data,
      celle: TIPI_TURNO_LAVORATIVI.map((tipo) => {
        const turno = turni[tipo] ?? null

        const nomiAssegnati = turno
          ? turno.assegnazioni.map((a) =>
              resolveInfermiereName(a.infermiere_id),
            )
          : []
        const assegnati = nomiAssegnati.join(', ')
        const assegnatiBreve = nomiAssegnati.map(abbreviateName).join(', ')
        const assegnatiCount = turno?.assegnazioni.length ?? 0

        return {
          tipo,
          turno,
          assegnati,
          assegnatiBreve,
          assegnatiCount,
          sottoCopertura:
            turno !== null && assegnatiCount < COPERTURA_MINIMA_TURNO,
        }
      }),
    }))
}
