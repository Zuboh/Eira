import { describe, expect, it } from 'vitest'
import {
  createEmptyGenericConsegnaForm,
  toSoapiePayload,
  toSbarPayload,
  validateConsegnaForm,
} from '@/features/patient-chart/form'
import type { GenericConsegnaForm } from '@/features/patient-chart/types'

function formWith(overrides: Partial<GenericConsegnaForm>) {
  return { ...createEmptyGenericConsegnaForm(), ...overrides }
}

const sbarTesto = 'S: dolore\nB: appendicectomia\nA: stabile\nR: rivalutare'
const soapieTesto =
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

describe('toSoapiePayload', () => {
  it('maps the parsed sections onto the payload', () => {
    const payload = toSoapiePayload(
      formWith({ testo: soapieTesto, tipo: 'soapie', turno_id: 5 }),
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
    const payload = toSoapiePayload(
      formWith({ testo: 'Paziente tranquillo.', tipo: 'soapie' }),
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

  it('accepts a fully filled SOAPIE consegna without a turno', () => {
    expect(
      validateConsegnaForm(
        formWith({ testo: soapieTesto, tipo: 'soapie', turno_id: null }),
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

  it('names the SOAPIE sections still to fill', () => {
    expect(
      validateConsegnaForm(
        formWith({ testo: 'Paziente tranquillo.', tipo: 'soapie' }),
      ),
    ).toBe(
      'Completa le sezioni mancanti: Emotività, Dolore, Emodinamica, Mobilizzazione, Alert.',
    )
  })
})
