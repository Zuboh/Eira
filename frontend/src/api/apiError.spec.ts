import { describe, expect, it } from 'vitest'
import { ApiError, apiErrorMessage, extractDetail } from '@/api/apiError'

describe('extractDetail', () => {
  it('reads the string detail of an HTTPException', () => {
    expect(extractDetail({ detail: 'Non sei assegnata a questo turno' })).toBe(
      'Non sei assegnata a questo turno',
    )
  })

  it('summarises the fields of a pydantic validation error', () => {
    const detail = [
      {
        loc: ['body', 'situation'],
        msg: 'String should have at least 1 character',
      },
      {
        loc: ['body', 'background'],
        msg: 'String should have at least 1 character',
      },
    ]

    expect(extractDetail({ detail })).toBe(
      'Alcuni campi non sono validi: situation, background.',
    )
  })

  it('deduplicates repeated fields', () => {
    const detail = [
      { loc: ['body', 'situation'], msg: 'a' },
      { loc: ['body', 'situation'], msg: 'b' },
    ]

    expect(extractDetail({ detail })).toBe(
      'Alcuni campi non sono validi: situation.',
    )
  })

  it('returns null for bodies without a usable detail', () => {
    expect(extractDetail({ detail: '   ' })).toBeNull()
    expect(extractDetail({ detail: [] })).toBeNull()
    expect(extractDetail({ message: 'boom' })).toBeNull()
    expect(extractDetail(undefined)).toBeNull()
    expect(extractDetail('boom')).toBeNull()
  })
})

describe('apiErrorMessage', () => {
  it('prefers the backend detail', () => {
    const err = new ApiError(
      'createConsegnaSbar',
      403,
      'Turno di un altro reparto',
      'boom',
    )

    expect(apiErrorMessage(err, 'fallback')).toBe('Turno di un altro reparto')
  })

  it('falls back when the error has no detail or is not an ApiError', () => {
    const senzaDetail = new ApiError('createConsegnaSbar', 500, null, 'boom')

    expect(apiErrorMessage(senzaDetail, 'fallback')).toBe('fallback')
    expect(apiErrorMessage(new Error('down'), 'fallback')).toBe('fallback')
    expect(apiErrorMessage('down', 'fallback')).toBe('fallback')
  })
})
