import { describe, expect, it } from 'vitest'
import { buildCalendarioRows } from '@/features/dashboard/calendarViewModel'
import type { TurnoCalendario } from '@/api/turni'

function turno(overrides: Partial<TurnoCalendario> = {}): TurnoCalendario {
  return {
    id: 1,
    data: '2026-07-20',
    tipo: 'mattina',
    reparto_id: 1,
    ora_inizio: '07:00:00',
    ora_fine: '14:00:00',
    assegnazioni: [],
    ...overrides,
  }
}

describe('buildCalendarioRows', () => {
  it('marks planned turni with fewer than two active assignments as sottoCopertura', () => {
    const rows = buildCalendarioRows(
      [
        turno({
          id: 1,
          tipo: 'mattina',
          assegnazioni: [
            { id: 1, turno_id: 1, infermiere_id: 10, stato: 'attiva' },
          ],
        }),
        turno({
          id: 2,
          tipo: 'pomeriggio',
          assegnazioni: [
            { id: 2, turno_id: 2, infermiere_id: 10, stato: 'attiva' },
            { id: 3, turno_id: 2, infermiere_id: 11, stato: 'attiva' },
          ],
        }),
      ],
      (id) => `Infermiere ${id}`,
    )

    const mattina = rows[0].celle.find((cella) => cella.tipo === 'mattina')
    const pomeriggio = rows[0].celle.find(
      (cella) => cella.tipo === 'pomeriggio',
    )

    expect(mattina?.assegnatiCount).toBe(1)
    expect(mattina?.sottoCopertura).toBe(true)
    expect(pomeriggio?.assegnatiCount).toBe(2)
    expect(pomeriggio?.sottoCopertura).toBe(false)
  })
})
