import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useBancaOre } from '@/features/banca-ore/useBancaOre'
import { useAuthStore } from '@/stores/auth'
import * as bancaOreApi from '@/api/bancaOre'
import * as repartiApi from '@/api/reparti'

vi.mock('@/api/bancaOre')
vi.mock('@/api/reparti')

const infermiere = {
  id: 9,
  email: 'x@x.it',
  nome: 'Anna',
  cognome: 'Rossi',
  ruolo: 'infermiere' as const,
  reparto_id: 1,
}
const bancaOre = {
  infermiere_id: 9,
  mese: '2026-07',
  ore_effettuate: 120,
  ore_contrattuali: 150,
  saldo: -30,
}

function mountBancaOre(options: Parameters<typeof useBancaOre>[0] = {}) {
  let result!: ReturnType<typeof useBancaOre>
  const host = defineComponent({
    setup() {
      result = useBancaOre(options)
      return () => h('div')
    },
  })
  mount(host)
  return result
}

async function flushMounted() {
  await nextTick()
  await nextTick()
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.mocked(bancaOreApi.getBancaOre).mockResolvedValue({ data: bancaOre })
  vi.mocked(repartiApi.listUtentiByReparto).mockResolvedValue({ data: [] })
})

describe('useBancaOre — infermiere self-view (default)', () => {
  it('loads its own banca ore on mount using the current user id', async () => {
    useAuthStore().user = infermiere
    const hook = mountBancaOre()
    await flushMounted()

    expect(bancaOreApi.getBancaOre).toHaveBeenCalledWith(9, hook.mese.value)
    expect(hook.bancaOre.value).toEqual(bancaOre)
  })

  it('sets an error and clears bancaOre on failure', async () => {
    useAuthStore().user = infermiere
    vi.mocked(bancaOreApi.getBancaOre).mockRejectedValue(new Error('down'))
    const hook = mountBancaOre()
    await flushMounted()

    expect(hook.error.value).toBe('Impossibile caricare la banca ore.')
    expect(hook.bancaOre.value).toBeNull()
  })

  it('is a no-op when there is no infermiereId to load', async () => {
    const hook = mountBancaOre()
    await flushMounted()

    expect(bancaOreApi.getBancaOre).not.toHaveBeenCalled()
    expect(hook.bancaOre.value).toBeNull()
  })
})

describe('useBancaOre — caposala mode (loadInfermieriForCaposala)', () => {
  it('loads reparto infermieri and defaults to the first one', async () => {
    useAuthStore().user = { ...infermiere, id: 1, ruolo: 'caposala' }
    vi.mocked(repartiApi.listUtentiByReparto).mockResolvedValue({
      data: [
        { id: 5, nome: 'Bruno', cognome: 'Verdi', ruolo: 'infermiere' },
        { id: 6, nome: 'Carla', cognome: 'Neri', ruolo: 'caposala' },
        { id: 7, nome: 'Dino', cognome: 'Bianchi', ruolo: 'infermiere' },
      ],
    })
    const hook = mountBancaOre({ loadInfermieriForCaposala: true })
    await flushMounted()

    expect(hook.infermieri.value.map((u) => u.id)).toEqual([5, 7])
    expect(hook.infermiereId.value).toBe(5)
  })

  it('does not call listUtentiByReparto for a non-caposala role', async () => {
    useAuthStore().user = infermiere
    mountBancaOre({ loadInfermieriForCaposala: true })
    await flushMounted()

    expect(repartiApi.listUtentiByReparto).not.toHaveBeenCalled()
  })
})

describe('useBancaOre — spostaMese', () => {
  it('moves the month forward and back, rolling over the year', () => {
    useAuthStore().user = infermiere
    const hook = mountBancaOre()
    hook.mese.value = '2026-12'

    hook.spostaMese(1)
    expect(hook.mese.value).toBe('2027-01')

    hook.spostaMese(-1)
    expect(hook.mese.value).toBe('2026-12')
  })

  it('reloads banca ore when mese changes (via the mese/infermiereId watcher)', async () => {
    useAuthStore().user = infermiere
    const hook = mountBancaOre()
    await flushMounted()
    vi.mocked(bancaOreApi.getBancaOre).mockClear()

    hook.spostaMese(1)
    await nextTick()

    expect(bancaOreApi.getBancaOre).toHaveBeenCalledWith(9, '2026-08')
  })
})
