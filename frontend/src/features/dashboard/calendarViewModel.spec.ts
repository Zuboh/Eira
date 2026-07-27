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
  it('marks only planned turni without active assignments as sottoCopertura', () => {
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
        turno({
          id: 3,
          tipo: 'notte',
          assegnazioni: [],
        }),
      ],
      (id) => `Infermiere ${id}`,
    )

    const mattina = rows[0].celle.find((cella) => cella.tipo === 'mattina')
    const pomeriggio = rows[0].celle.find(
      (cella) => cella.tipo === 'pomeriggio',
    )
    const notte = rows[0].celle.find((cella) => cella.tipo === 'notte')

    expect(mattina?.assegnatiCount).toBe(1)
    expect(mattina?.assegnatiBreve).toBe('Infermiere 1.')
    expect(mattina?.sottoCopertura).toBe(false)
    expect(pomeriggio?.assegnatiCount).toBe(2)
    expect(pomeriggio?.sottoCopertura).toBe(false)
    expect(notte?.assegnatiCount).toBe(0)
    expect(notte?.sottoCopertura).toBe(true)
  })

  it('builds only the three working-shift columns and ignores absence rows', () => {
    const rows = buildCalendarioRows(
      [turno({ id: 1, tipo: 'mattina' }), turno({ id: 2, tipo: 'riposo' })],
      (id) => `Infermiere ${id}`,
    )

    expect(rows).toHaveLength(1)
    expect(rows[0].celle.map((cella) => cella.tipo)).toEqual([
      'mattina',
      'pomeriggio',
      'notte',
    ])
    expect(rows[0].celle.every((cella) => cella.tipo !== 'riposo')).toBe(true)
  })
})
