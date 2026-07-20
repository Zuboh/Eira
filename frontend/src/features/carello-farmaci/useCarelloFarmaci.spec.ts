import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCarelloFarmaci } from '@/features/carello-farmaci/useCarelloFarmaci'
import * as api from '@/api/carelloFarmaci'
import type { CarelloFarmaco } from '@/api/carelloFarmaci'

vi.mock('@/api/carelloFarmaci')

function riga(overrides: Partial<CarelloFarmaco> = {}): CarelloFarmaco {
  return {
    id: 1,
    farmaco_id: 10,
    reparto_id: 2,
    quantita: 4,
    soglia_minima: 5,
    prossima_scadenza: '2026-07-25',
    farmaco: {
      id: 10,
      nome: 'Paracetamolo',
      unita_misura: 'compresse',
      categoria: 'Analgesici',
    },
    ...overrides,
  }
}

beforeEach(() => {
  vi.mocked(api.listCarelloFarmaci).mockResolvedValue({ data: [] })
  vi.mocked(api.listMovimentiFarmaci).mockResolvedValue({ data: [] })
})

describe('useCarelloFarmaci — load and filtrati', () => {
  it('loads the full reparto-scoped carello once, with no filter params', async () => {
    vi.mocked(api.listCarelloFarmaci).mockResolvedValue({ data: [riga()] })
    const hook = useCarelloFarmaci()
    hook.search.value = 'para'
    hook.categoria.value = 'Analgesici'

    await hook.load()

    expect(api.listCarelloFarmaci).toHaveBeenCalledWith()
    expect(hook.farmaci.value).toEqual([riga()])
  })

  it('filtrati narrows by search (case-insensitive substring on nome)', async () => {
    vi.mocked(api.listCarelloFarmaci).mockResolvedValue({
      data: [
        riga({ id: 1, farmaco: { id: 10, nome: 'Paracetamolo', unita_misura: 'compresse', categoria: 'Analgesici' } }),
        riga({ id: 2, farmaco: { id: 11, nome: 'Ibuprofene', unita_misura: 'compresse', categoria: 'Antinfiammatori' } }),
      ],
    })
    const hook = useCarelloFarmaci()
    await hook.load()

    hook.search.value = 'PARA'

    expect(hook.farmaciFiltrati.value.map((r) => r.id)).toEqual([1])
  })

  it('filtrati narrows by categoria (exact match)', async () => {
    vi.mocked(api.listCarelloFarmaci).mockResolvedValue({
      data: [
        riga({ id: 1, farmaco: { id: 10, nome: 'Paracetamolo', unita_misura: 'compresse', categoria: 'Analgesici' } }),
        riga({ id: 2, farmaco: { id: 11, nome: 'Ibuprofene', unita_misura: 'compresse', categoria: 'Antinfiammatori' } }),
      ],
    })
    const hook = useCarelloFarmaci()
    await hook.load()

    hook.categoria.value = 'Antinfiammatori'

    expect(hook.farmaciFiltrati.value.map((r) => r.id)).toEqual([2])
  })

  it('filtrati combines search and categoria', async () => {
    vi.mocked(api.listCarelloFarmaci).mockResolvedValue({
      data: [
        riga({ id: 1, farmaco: { id: 10, nome: 'Paracetamolo', unita_misura: 'compresse', categoria: 'Analgesici' } }),
        riga({ id: 2, farmaco: { id: 12, nome: 'Paratormone', unita_misura: 'fiale', categoria: 'Ormoni' } }),
      ],
    })
    const hook = useCarelloFarmaci()
    await hook.load()

    hook.search.value = 'para'
    hook.categoria.value = 'Ormoni'

    expect(hook.farmaciFiltrati.value.map((r) => r.id)).toEqual([2])
  })

  it('optimistically adjusts quantity and replaces with server row', async () => {
    vi.mocked(api.updateCarelloFarmaco).mockResolvedValue({
      data: riga({ quantita: 5 }),
    })
    const hook = useCarelloFarmaci()
    hook.farmaci.value = [riga({ quantita: 4 })]

    await hook.adjust(hook.farmaci.value[0], 1)

    expect(api.updateCarelloFarmaco).toHaveBeenCalledWith(1, { delta: 1 })
    expect(hook.farmaci.value[0].quantita).toBe(5)
    expect(api.listMovimentiFarmaci).toHaveBeenCalled()
  })

  it('rolls back optimistic quantity on failure', async () => {
    vi.mocked(api.updateCarelloFarmaco).mockRejectedValue(new Error('down'))
    const hook = useCarelloFarmaci()
    hook.farmaci.value = [riga({ quantita: 4 })]

    await hook.adjust(hook.farmaci.value[0], 1)

    expect(hook.farmaci.value[0].quantita).toBe(4)
    expect(hook.error.value).toBe('Impossibile aggiornare la quantità.')
  })
})
