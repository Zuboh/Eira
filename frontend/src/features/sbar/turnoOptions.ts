import type { AssegnazioneTurno, TipoTurno, Turno } from '@/api/turni'

export type AssegnazioneTurnoOption = AssegnazioneTurno & {
  label: string
  data?: string
  tipo?: TipoTurno
  ora_inizio?: string
  ora_fine?: string
}

const tipoLabels: Record<TipoTurno, string> = {
  mattina: 'Mattina',
  pomeriggio: 'Pomeriggio',
  notte: 'Notte',
  riposo: 'Riposo',
  ferie: 'Ferie',
  ferie_estive: 'Ferie estive',
}

export function todayIsoDate() {
  return new Date().toLocaleDateString('sv-SE')
}

export function dateFromIsoDate(value: string | null) {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

export function isoDateFromDate(value: Date | null | undefined) {
  if (!value) return null
  return value.toLocaleDateString('sv-SE')
}

function formatDate(value: string) {
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

function formatTime(value: string) {
  return value.slice(0, 5)
}

function formatTurnoLabel(turno: Turno) {
  return `${formatDate(turno.data)} — ${tipoLabels[turno.tipo]} (${formatTime(turno.ora_inizio)}–${formatTime(turno.ora_fine)})`
}

export function buildAssegnazioneTurnoOptions(
  assegnazioni: AssegnazioneTurno[],
  turni: Turno[],
): AssegnazioneTurnoOption[] {
  const turniById = new Map(turni.map((turno) => [turno.id, turno]))

  return assegnazioni
    .map((assegnazione): AssegnazioneTurnoOption => {
      const turno = turniById.get(assegnazione.turno_id)
      if (!turno) {
        return {
          ...assegnazione,
          label: `Turno #${assegnazione.turno_id}`,
        }
      }

      return {
        ...assegnazione,
        data: turno.data,
        tipo: turno.tipo,
        ora_inizio: turno.ora_inizio,
        ora_fine: turno.ora_fine,
        label: formatTurnoLabel(turno),
      }
    })
    .sort((a, b) => {
      const dateCompare = (b.data ?? '').localeCompare(a.data ?? '')
      if (dateCompare !== 0) return dateCompare
      return (a.ora_inizio ?? '').localeCompare(b.ora_inizio ?? '')
    })
}

export function findTurnoByDate(
  options: AssegnazioneTurnoOption[],
  date: string | null,
) {
  if (!date) return null
  return options.find((option) => option.data === date) ?? null
}

export function turnoIdForDate(
  options: AssegnazioneTurnoOption[],
  date: string | null,
) {
  return findTurnoByDate(options, date)?.turno_id ?? null
}

export function turnoLabelForDate(
  options: AssegnazioneTurnoOption[],
  date: string | null,
) {
  return findTurnoByDate(options, date)?.label ?? null
}
