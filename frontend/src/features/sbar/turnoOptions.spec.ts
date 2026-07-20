import { describe, expect, it } from 'vitest'
import {
  buildAssegnazioneTurnoOptions,
  turnoIdForDate,
} from '@/features/sbar/turnoOptions'

const assegnazioni = [
  { id: 1, turno_id: 10, infermiere_id: 9, stato: 'attiva' as const },
  { id: 2, turno_id: 11, infermiere_id: 9, stato: 'attiva' as const },
]

const turni = [
  {
    id: 10,
    data: '2026-07-18',
    tipo: 'mattina' as const,
    reparto_id: 1,
    ora_inizio: '07:00:00',
    ora_fine: '14:00:00',
  },
  {
    id: 11,
    data: '2026-07-20',
    tipo: 'pomeriggio' as const,
    reparto_id: 1,
    ora_inizio: '14:00:00',
    ora_fine: '21:00:00',
  },
]

describe('turnoOptions', () => {
  it('formats assigned turni with human-readable date/type/time labels, newest first', () => {
    const options = buildAssegnazioneTurnoOptions(assegnazioni, turni)

    expect(options.map((option) => option.turno_id)).toEqual([11, 10])
    expect(options[0].label).toBe('20/07/2026 — Pomeriggio (14:00–21:00)')
    expect(options[1].label).toBe('18/07/2026 — Mattina (07:00–14:00)')
  })

  it('finds the assigned turno from the selected date', () => {
    const options = buildAssegnazioneTurnoOptions(assegnazioni, turni)

    expect(turnoIdForDate(options, '2026-07-20')).toBe(11)
    expect(turnoIdForDate(options, '2026-07-19')).toBeNull()
  })
})
