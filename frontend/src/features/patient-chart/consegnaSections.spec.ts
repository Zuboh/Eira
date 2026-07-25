import { describe, expect, it } from 'vitest'
import {
  buildScaffold,
  findEmptySections,
  isPristineScaffold,
  parseConsegnaText,
  sectionsFor,
  serializeToSigle,
} from '@/features/patient-chart/consegnaSections'

describe('sectionsFor', () => {
  it('describes the four SBAR sections in order', () => {
    expect(sectionsFor('sbar').map((section) => section.key)).toEqual([
      'situation',
      'background',
      'assessment',
      'recommendation',
    ])
    expect(sectionsFor('sbar').map((section) => section.sigla)).toEqual([
      'S',
      'B',
      'A',
      'R',
    ])
  })

  it('describes the six CEDEMA sections with both E labelled distinctly', () => {
    const sections = sectionsFor('cedema')
    expect(sections.map((section) => section.key)).toEqual([
      'coscienza',
      'emotivita',
      'dolore',
      'emodinamica',
      'mobilizzazione',
      'allert',
    ])
    expect(sections.map((section) => section.sigla)).toEqual([
      'C',
      'E',
      'D',
      'E',
      'M',
      'A',
    ])
    expect(sections[1].label).toBe('Emotività')
    expect(sections[3].label).toBe('Emodinamica')
  })

  it('marks only time-insensitive sections as copy-forward', () => {
    const copyForward = (tipo: 'sbar' | 'cedema') =>
      sectionsFor(tipo)
        .filter((section) => section.copyForward)
        .map((section) => section.key)

    expect(copyForward('sbar')).toEqual(['background'])
    expect(copyForward('cedema')).toEqual(['coscienza', 'mobilizzazione'])
  })

  it('requires every section of both types', () => {
    expect(sectionsFor('sbar').every((section) => section.required)).toBe(true)
    expect(sectionsFor('cedema').every((section) => section.required)).toBe(
      true,
    )
  })

  it('gives every section a non-empty hint', () => {
    const sections = [...sectionsFor('sbar'), ...sectionsFor('cedema')]
    expect(sections.every((section) => section.hint.trim().length > 0)).toBe(
      true,
    )
  })
})

describe('buildScaffold', () => {
  it('writes one sigla marker per section', () => {
    expect(buildScaffold('sbar')).toBe('S:\nB:\nA:\nR:')
    expect(buildScaffold('cedema')).toBe('C:\nE:\nD:\nE:\nM:\nA:')
  })

  it('round-trips to empty sections', () => {
    const parsed = parseConsegnaText(buildScaffold('sbar'), 'sbar')
    expect(parsed.values).toEqual({
      situation: '',
      background: '',
      assessment: '',
      recommendation: '',
    })
    expect(parsed.hasOrphanText).toBe(false)
  })
})

describe('isPristineScaffold', () => {
  it('treats empty text as pristine', () => {
    expect(isPristineScaffold('')).toBe(true)
    expect(isPristineScaffold('   \n  ')).toBe(true)
  })

  it('treats an untouched scaffold of either type as pristine', () => {
    expect(isPristineScaffold(buildScaffold('sbar'))).toBe(true)
    expect(isPristineScaffold(buildScaffold('cedema'))).toBe(true)
  })

  it('is not pristine once any section has content', () => {
    expect(isPristineScaffold('S:\nB: allettato\nA:\nR:')).toBe(false)
  })

  it('is not pristine for free text', () => {
    expect(isPristineScaffold('Notte agitata.')).toBe(false)
  })
})

describe('parseConsegnaText', () => {
  it('reads sections from sigla markers anchored at line start', () => {
    const parsed = parseConsegnaText(
      'S: dolore addominale\nB: appendicectomia in seconda giornata\nA: parametri stabili\nR: rivalutare alle 22',
      'sbar',
    )

    expect(parsed.values).toEqual({
      situation: 'dolore addominale',
      background: 'appendicectomia in seconda giornata',
      assessment: 'parametri stabili',
      recommendation: 'rivalutare alle 22',
    })
    expect(parsed.hasOrphanText).toBe(false)
  })

  it('accepts extended labels, italian aliases and mixed case', () => {
    const parsed = parseConsegnaText(
      'situazione: dolore\nBACKGROUND: appendicectomia\nValutazione: stabile\nRaccomandazione: rivalutare',
      'sbar',
    )

    expect(parsed.values.situation).toBe('dolore')
    expect(parsed.values.background).toBe('appendicectomia')
    expect(parsed.values.assessment).toBe('stabile')
    expect(parsed.values.recommendation).toBe('rivalutare')
  })

  it('accepts dash and parenthesis separators', () => {
    const parsed = parseConsegnaText(
      'S - dolore\nB) appendicectomia\nA: stabile\nR: rivalutare',
      'sbar',
    )

    expect(parsed.values.situation).toBe('dolore')
    expect(parsed.values.background).toBe('appendicectomia')
  })

  it('keeps multi-line section bodies intact, blank lines included', () => {
    const parsed = parseConsegnaText(
      'S: dolore\nancora presente\n\ndopo terapia\nB: appendicectomia\nA: stabile\nR: rivalutare',
      'sbar',
    )

    expect(parsed.values.situation).toBe(
      'dolore\nancora presente\n\ndopo terapia',
    )
    expect(parsed.values.background).toBe('appendicectomia')
  })

  it('does not treat a marker word in the middle of a line as a boundary', () => {
    const parsed = parseConsegnaText(
      'C: vigile, riferisce dolore: 7/10\nE: sereno\nD: addominale\nE: pressione stabile\nM: allettato\nA: nessuna',
      'cedema',
    )

    expect(parsed.values.coscienza).toBe('vigile, riferisce dolore: 7/10')
    expect(parsed.values.dolore).toBe('addominale')
  })

  it('moves preamble text into the first section and flags it', () => {
    const parsed = parseConsegnaText(
      'Notte agitata.\nS: dolore\nB: appendicectomia\nA: stabile\nR: rivalutare',
      'sbar',
    )

    expect(parsed.values.situation).toBe('Notte agitata.\ndolore')
    expect(parsed.hasOrphanText).toBe(true)
  })

  it('keeps every paragraph when the text has no markers at all', () => {
    const testo = 'primo\n\nsecondo\n\nterzo\n\nquarto\n\nquinto'
    const parsed = parseConsegnaText(testo, 'sbar')

    expect(parsed.values.situation).toBe(testo)
    expect(parsed.values.background).toBe('')
    expect(parsed.values.assessment).toBe('')
    expect(parsed.values.recommendation).toBe('')
    expect(parsed.hasOrphanText).toBe(true)
  })

  it('returns empty sections for empty text without flagging orphan text', () => {
    const parsed = parseConsegnaText('   ', 'sbar')

    expect(parsed.values.situation).toBe('')
    expect(parsed.hasOrphanText).toBe(false)
  })

  it('resolves the two CEDEMA E markers by position', () => {
    const parsed = parseConsegnaText(
      'C: vigile\nE: tranquillo\nD: assente\nE: PA 120/80\nM: autonomo\nA: nessuna',
      'cedema',
    )

    expect(parsed.values.emotivita).toBe('tranquillo')
    expect(parsed.values.emodinamica).toBe('PA 120/80')
  })

  it('prefers the extended CEDEMA label over positional order', () => {
    const parsed = parseConsegnaText(
      'C: vigile\nEmodinamica: PA 120/80\nD: assente\nEmotività: tranquillo\nM: autonomo\nA: nessuna',
      'cedema',
    )

    expect(parsed.values.emodinamica).toBe('PA 120/80')
    expect(parsed.values.emotivita).toBe('tranquillo')
  })

  it('keeps a repeated marker inside the section already open', () => {
    const parsed = parseConsegnaText(
      'S: dolore\nB: appendicectomia\nS: ricomparso\nA: stabile\nR: rivalutare',
      'sbar',
    )

    expect(parsed.values.situation).toBe('dolore')
    expect(parsed.values.background).toBe('appendicectomia\nS: ricomparso')
  })

  it('ignores carriage returns', () => {
    const parsed = parseConsegnaText(
      'S: dolore\r\nB: appendicectomia\r\nA: stabile\r\nR: rivalutare',
      'sbar',
    )

    expect(parsed.values.situation).toBe('dolore')
    expect(parsed.values.background).toBe('appendicectomia')
  })
})

describe('serializeToSigle', () => {
  it('writes one sigla line per section', () => {
    const text = serializeToSigle(
      {
        situation: 'dolore',
        background: 'appendicectomia',
        assessment: 'stabile',
        recommendation: 'rivalutare',
      },
      'sbar',
    )

    expect(text).toBe(
      'S: dolore\nB: appendicectomia\nA: stabile\nR: rivalutare',
    )
  })

  it('emits an empty marker for a missing section', () => {
    const text = serializeToSigle({ situation: 'dolore' }, 'sbar')

    expect(text).toBe('S: dolore\nB:\nA:\nR:')
  })

  it('round-trips through the parser, multi-line values included', () => {
    const values = {
      coscienza: 'vigile',
      emotivita: 'tranquillo',
      dolore: 'assente\n\nnessuna terapia al bisogno',
      emodinamica: 'PA 120/80',
      mobilizzazione: 'autonomo',
      allert: 'nessuna',
    }

    expect(
      parseConsegnaText(serializeToSigle(values, 'cedema'), 'cedema'),
    ).toEqual({ values, hasOrphanText: false })
  })
})

describe('findEmptySections', () => {
  it('returns the sections still to fill', () => {
    const missing = findEmptySections(
      { situation: 'dolore', background: '   ', assessment: 'stabile' },
      'sbar',
    )

    expect(missing.map((section) => section.key)).toEqual([
      'background',
      'recommendation',
    ])
  })

  it('returns nothing when every section has content', () => {
    const missing = findEmptySections(
      {
        situation: 'dolore',
        background: 'appendicectomia',
        assessment: 'stabile',
        recommendation: 'rivalutare',
      },
      'sbar',
    )

    expect(missing).toEqual([])
  })
})
