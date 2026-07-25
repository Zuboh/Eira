import { describe, expect, it } from 'vitest'
import {
  createEmptyGenericConsegnaForm,
  toCedemaPayload,
  toSbarPayload,
  validateConsegnaForm,
} from '@/features/patient-chart/form'
import type { GenericConsegnaForm } from '@/features/patient-chart/types'

function formWith(overrides: Partial<GenericConsegnaForm>) {
  return { ...createEmptyGenericConsegnaForm(), ...overrides }
}

const sbarTesto = 'S: dolore\nB: appendicectomia\nA: stabile\nR: rivalutare'
const cedemaTesto =
  'C: vigile\nE: tranquillo\nD: assente\nE: PA 120/80\nM: autonomo\nA: nessuna'

describe('toSbarPayload', () => {
  it('maps the parsed sections onto the payload', () => {
    const payload = toSbarPayload(7, {
      ...formWith({ testo: sbarTesto, priorita: 'urgente' }),
      turno_id: 3,
    })

    expect(payload).toEqual({
      paziente_id: 7,
      turno_id: 3,
      situation: 'dolore',
      background: 'appendicectomia',
      assessment: 'stabile',
      recommendation: 'rivalutare',
      priorita: 'urgente',
    })
  })

  it('keeps text written before the first marker', () => {
    const payload = toSbarPayload(7, {
      ...formWith({ testo: `Notte agitata.\n${sbarTesto}` }),
      turno_id: 3,
    })

    expect(payload.situation).toBe('Notte agitata.\ndolore')
  })

  it('does not invent placeholder content for missing sections', () => {
    const payload = toSbarPayload(7, {
      ...formWith({ testo: 'S: dolore' }),
      turno_id: 3,
    })

    expect(payload.background).toBe('')
    expect(payload.assessment).toBe('')
    expect(payload.recommendation).toBe('')
  })
})

describe('toCedemaPayload', () => {
  it('maps the parsed sections onto the payload', () => {
    const payload = toCedemaPayload(
      formWith({ testo: cedemaTesto, tipo: 'cedema', turno_id: 5 }),
    )

    expect(payload).toEqual({
      turno_id: 5,
      coscienza: 'vigile',
      emotivita: 'tranquillo',
      dolore: 'assente',
      emodinamica: 'PA 120/80',
      mobilizzazione: 'autonomo',
      allert: 'nessuna',
    })
  })

  it('no longer dumps unparsed text into allert', () => {
    const payload = toCedemaPayload(
      formWith({ testo: 'Paziente tranquillo.', tipo: 'cedema' }),
    )

    expect(payload.coscienza).toBe('Paziente tranquillo.')
    expect(payload.allert).toBe('')
  })
})

describe('validateConsegnaForm', () => {
  it('accepts a fully filled SBAR consegna', () => {
    expect(
      validateConsegnaForm(formWith({ testo: sbarTesto, turno_id: 3 })),
    ).toBeNull()
  })

  it('accepts a fully filled CEDEMA consegna without a turno', () => {
    expect(
      validateConsegnaForm(
        formWith({ testo: cedemaTesto, tipo: 'cedema', turno_id: null }),
      ),
    ).toBeNull()
  })

  it('rejects empty text', () => {
    expect(validateConsegnaForm(formWith({ testo: '   ', turno_id: 3 }))).toBe(
      'Inserisci il testo della consegna.',
    )
  })

  it('rejects an untouched scaffold as empty text', () => {
    expect(
      validateConsegnaForm(formWith({ testo: 'S:\nB:\nA:\nR:', turno_id: 3 })),
    ).toBe('Inserisci il testo della consegna.')
  })

  it('rejects an SBAR consegna without an assigned turno', () => {
    expect(
      validateConsegnaForm(formWith({ testo: sbarTesto, turno_id: null })),
    ).toBe('Seleziona una data con turno assegnato per una consegna SBAR.')
  })

  it('names the sections still to fill', () => {
    expect(
      validateConsegnaForm(
        formWith({ testo: 'S: dolore\nA: stabile', turno_id: 3 }),
      ),
    ).toBe('Completa le sezioni mancanti: Background, Recommendation.')
  })

  it('names the CEDEMA sections still to fill', () => {
    expect(
      validateConsegnaForm(
        formWith({ testo: 'Paziente tranquillo.', tipo: 'cedema' }),
      ),
    ).toBe(
      'Completa le sezioni mancanti: Emotività, Dolore, Emodinamica, Mobilizzazione, Allert.',
    )
  })
})
