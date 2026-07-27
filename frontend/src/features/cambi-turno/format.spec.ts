import { expect, it } from 'vitest'
import type { RichiestaCambioTurno } from '@/api/cambiTurno'
import { formatCambioRichiesto } from '@/features/cambi-turno/format'

it('formats both sides of the requested swap', () => {
  const richiesta = {
    turno_richiedente: {
      data: '2026-07-27',
      tipo: 'mattina',
    },
    turno_collega: {
      data: '2026-07-27',
      tipo: 'pomeriggio',
    },
  } as RichiestaCambioTurno

  expect(formatCambioRichiesto(richiesta)).toBe(
    'lun 27 lug · Mattina → lun 27 lug · Pomeriggio',
  )
})
