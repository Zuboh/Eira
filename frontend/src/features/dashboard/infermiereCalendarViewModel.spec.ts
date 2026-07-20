import { describe, expect, it } from 'vitest'
import { buildTurniEvents } from '@/features/dashboard/infermiereCalendarViewModel'
import type { ProssimoTurnoConColleghi } from '@/api/turni'

function turnoConColleghi(
  overrides: Partial<ProssimoTurnoConColleghi> = {},
): ProssimoTurnoConColleghi {
  return {
    turno: {
      id: 1,
      data: '2026-07-20',
      tipo: 'mattina',
      reparto_id: 1,
      ora_inizio: '07:00:00',
      ora_fine: '14:00:00',
    },
    colleghi: [
      { id: 2, nome: 'Anna', cognome: 'Rossi', ruolo: 'infermiere' },
      { id: 3, nome: 'Bruno', cognome: 'Verdi', ruolo: 'infermiere' },
    ],
    ...overrides,
  }
}

describe('buildTurniEvents', () => {
  it('adds colleague data to calendar event extended props', () => {
    const events = buildTurniEvents([turnoConColleghi()])

    expect(events).toEqual([
      expect.objectContaining({
        id: '1',
        title: 'Mattina',
        start: '2026-07-20',
        classNames: ['turno-mattina'],
        extendedProps: {
          data: '2026-07-20',
          tipoLabel: 'Mattina',
          orario: '07:00–14:00',
          colleghi: ['Rossi Anna', 'Verdi Bruno'],
          isLavorativo: true,
        },
      }),
    ])
  })

  it('keeps an empty colleague list for solo shifts', () => {
    const events = buildTurniEvents([turnoConColleghi({ colleghi: [] })])

    expect(events[0].extendedProps).toEqual(
      expect.objectContaining({ colleghi: [] }),
    )
  })

  it('disables work tooltip data for riposo shifts', () => {
    const events = buildTurniEvents([
      turnoConColleghi({
        turno: {
          id: 2,
          data: '2026-07-21',
          tipo: 'riposo',
          reparto_id: 1,
          ora_inizio: '00:00:00',
          ora_fine: '00:00:00',
        },
      }),
    ])

    expect(events[0].extendedProps).toEqual(
      expect.objectContaining({ isLavorativo: false }),
    )
  })
})
