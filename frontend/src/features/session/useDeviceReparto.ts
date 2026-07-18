import { ref } from 'vue'

const DEVICE_REPARTO_STORAGE_KEY = 'eira_device_reparto'

export type DeviceRepartoId = number

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

function parseDeviceRepartoId(value: string | null): DeviceRepartoId | null {
  if (!value) return null

  const repartoId = Number(value)
  if (!Number.isInteger(repartoId) || repartoId <= 0) return null

  return repartoId
}

function readDeviceRepartoId(): DeviceRepartoId | null {
  return parseDeviceRepartoId(
    getStorage()?.getItem(DEVICE_REPARTO_STORAGE_KEY) ?? null,
  )
}

export const deviceRepartoId = ref<DeviceRepartoId | null>(
  readDeviceRepartoId(),
)

export function getDeviceRepartoId(): DeviceRepartoId | null {
  const repartoId = readDeviceRepartoId()
  deviceRepartoId.value = repartoId
  return repartoId
}

export function setDeviceRepartoId(id: DeviceRepartoId): void {
  const repartoId = parseDeviceRepartoId(String(id))
  if (repartoId === null) {
    clearDeviceRepartoId()
    return
  }

  getStorage()?.setItem(DEVICE_REPARTO_STORAGE_KEY, String(repartoId))
  deviceRepartoId.value = repartoId
}

export function clearDeviceRepartoId(): void {
  getStorage()?.removeItem(DEVICE_REPARTO_STORAGE_KEY)
  deviceRepartoId.value = null
}
