import { describe, expect, it } from 'vitest'
import { buildClinicalTimeline } from './timeline'

describe('structured clinical timeline', () => {
  it('preserves section labels, values, author, priority and chronological order', () => {
    const entries = buildClinicalTimeline(
      [
        {
          id: 1,
          paziente_id: 7,
          autore_id: 9,
          turno_id: null,
          timestamp: '2026-10-15T08:00:00',
          coscienza: 'Vigile',
          emotivita: 'Tranquillo',
          dolore: 'Assente',
          emodinamica: 'PA 120/80',
          mobilizzazione: 'Autonomo',
          allert: 'Nessuno',
        },
      ],
      [
        {
          id: 2,
          paziente_id: 7,
          autore_id: 10,
          turno_id: 3,
          creata_il: '2026-10-15T09:00:00',
          situation: 'Dolore acuto\nNRS 7',
          background: 'Intervento ieri',
          assessment: 'Vigile',
          recommendation: 'Rivalutare alle 10',
          priorita: 'urgente',
        },
      ],
    )
    expect(entries.map((entry) => entry.id)).toEqual(['sbar-2', 'soapie-1'])
    expect(entries[0]).toMatchObject({
      autoreId: 10,
      priorita: 'urgente',
      sections: [
        { label: 'Situation', value: 'Dolore acuto\nNRS 7' },
        { label: 'Background', value: 'Intervento ieri' },
        { label: 'Assessment', value: 'Vigile' },
        { label: 'Recommendation', value: 'Rivalutare alle 10' },
      ],
    })
    expect(entries[1].sections.map((section) => section.value)).toEqual([
      'Vigile',
      'Tranquillo',
      'Assente',
      'PA 120/80',
      'Autonomo',
      'Nessuno',
    ])
  })
})
