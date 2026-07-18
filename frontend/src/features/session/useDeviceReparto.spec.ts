import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearDeviceRepartoId,
  getDeviceRepartoId,
  setDeviceRepartoId,
} from '@/features/session/useDeviceReparto'

const KEY = 'eira_device_reparto'

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

describe('setDeviceRepartoId', () => {
  it('persists a valid id and it can be read back', () => {
    setDeviceRepartoId(5)
    expect(localStorage.getItem(KEY)).toBe('5')
    expect(getDeviceRepartoId()).toBe(5)
  })

  it('clears storage instead of persisting an invalid id (e.g. 0)', () => {
    localStorage.setItem(KEY, '7')
    setDeviceRepartoId(0)
    expect(localStorage.getItem(KEY)).toBeNull()
  })
})

describe('clearDeviceRepartoId', () => {
  it('removes the stored id', () => {
    setDeviceRepartoId(4)
    clearDeviceRepartoId()
    expect(localStorage.getItem(KEY)).toBeNull()
    expect(getDeviceRepartoId()).toBeNull()
  })
})
