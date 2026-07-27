import { ref } from 'vue'

const DEVICE_REPARTO_STORAGE_KEY = 'eira_device_reparto'
const DEVICE_REPARTO_NOME_STORAGE_KEY = 'eira_device_reparto_nome'

export type DeviceRepartoId = number
export type DeviceReparto = {
  id: DeviceRepartoId
  nome: string
}

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

function readDeviceRepartoNome(): string | null {
  // A stored name without a valid id is orphaned state: ignore it.
  if (readDeviceRepartoId() === null) return null

  const nome = getStorage()?.getItem(DEVICE_REPARTO_NOME_STORAGE_KEY) ?? null
  return nome || null
}

export const deviceRepartoId = ref<DeviceRepartoId | null>(
  readDeviceRepartoId(),
)

export const deviceRepartoNome = ref<string | null>(readDeviceRepartoNome())

export function getDeviceRepartoId(): DeviceRepartoId | null {
  const repartoId = readDeviceRepartoId()
  deviceRepartoId.value = repartoId
  return repartoId
}

export function getDeviceRepartoNome(): string | null {
  const nome = readDeviceRepartoNome()
  deviceRepartoNome.value = nome
  return nome
}

export function setDeviceReparto(reparto: DeviceReparto): void {
  const repartoId = parseDeviceRepartoId(String(reparto.id))
  if (repartoId === null) {
    clearDeviceReparto()
    return
  }

  const storage = getStorage()
  storage?.setItem(DEVICE_REPARTO_STORAGE_KEY, String(repartoId))
  storage?.setItem(DEVICE_REPARTO_NOME_STORAGE_KEY, reparto.nome)
  deviceRepartoId.value = repartoId
  deviceRepartoNome.value = reparto.nome || null
}

export function clearDeviceReparto(): void {
  const storage = getStorage()
  storage?.removeItem(DEVICE_REPARTO_STORAGE_KEY)
  storage?.removeItem(DEVICE_REPARTO_NOME_STORAGE_KEY)
  deviceRepartoId.value = null
  deviceRepartoNome.value = null
}
