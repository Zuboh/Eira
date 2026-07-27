import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearDeviceReparto,
  getDeviceRepartoId,
  getDeviceRepartoNome,
  setDeviceReparto,
} from '@/features/session/useDeviceReparto'

const KEY = 'eira_device_reparto'
const NOME_KEY = 'eira_device_reparto_nome'

beforeEach(() => {
  localStorage.clear()
})

describe('getDeviceRepartoId', () => {
  it('returns null when nothing is stored', () => {
    expect(getDeviceRepartoId()).toBeNull()
  })

  it('returns the stored id when valid', () => {
    localStorage.setItem(KEY, '3')
    expect(getDeviceRepartoId()).toBe(3)
  })

  it.each(['0', '-1', 'abc', ''])(
    'treats invalid stored value %s as null',
    (raw) => {
      localStorage.setItem(KEY, raw)
      expect(getDeviceRepartoId()).toBeNull()
    },
  )
})

describe('getDeviceRepartoNome', () => {
  it('returns null when nothing is stored', () => {
    expect(getDeviceRepartoNome()).toBeNull()
  })

  it('returns null for a device saved before the name was persisted', () => {
    localStorage.setItem(KEY, '3')
    expect(getDeviceRepartoNome()).toBeNull()
  })

  it('ignores an orphaned name with no valid id', () => {
    localStorage.setItem(NOME_KEY, 'Cardiologia')
    expect(getDeviceRepartoNome()).toBeNull()
  })
})

describe('setDeviceReparto', () => {
  it('persists id and name, and both can be read back', () => {
    setDeviceReparto({ id: 5, nome: 'Cardiologia' })

    expect(localStorage.getItem(KEY)).toBe('5')
    expect(localStorage.getItem(NOME_KEY)).toBe('Cardiologia')
    expect(getDeviceRepartoId()).toBe(5)
    expect(getDeviceRepartoNome()).toBe('Cardiologia')
  })

  it('clears storage instead of persisting an invalid id (e.g. 0)', () => {
    localStorage.setItem(KEY, '7')
    localStorage.setItem(NOME_KEY, 'Medicina')

    setDeviceReparto({ id: 0, nome: 'Cardiologia' })

    expect(localStorage.getItem(KEY)).toBeNull()
    expect(localStorage.getItem(NOME_KEY)).toBeNull()
  })
})

describe('clearDeviceReparto', () => {
  it('removes both the stored id and name', () => {
    setDeviceReparto({ id: 4, nome: 'Cardiologia' })

    clearDeviceReparto()

    expect(localStorage.getItem(KEY)).toBeNull()
    expect(localStorage.getItem(NOME_KEY)).toBeNull()
    expect(getDeviceRepartoId()).toBeNull()
    expect(getDeviceRepartoNome()).toBeNull()
  })
})
