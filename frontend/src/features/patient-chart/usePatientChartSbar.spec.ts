import { describe, expect, it, vi, beforeEach } from 'vitest'
import { usePatientChartSbar } from '@/features/patient-chart/usePatientChartSbar'
import * as consegneSbarApi from '@/api/consegneSbar'

vi.mock('@/api/consegneSbar')

const consegne = [
  { id: 1, paziente_id: 1, priorita: 'normale' },
  { id: 2, paziente_id: 2, priorita: 'normale' },
]

beforeEach(() => {
  vi.mocked(consegneSbarApi.listConsegneSbar).mockResolvedValue({
    data: { items: consegne as never, total: 2 },
  })
})

describe('usePatientChartSbar — loadConsegneSbar', () => {
  it('loads and filters consegne for the given paziente', async () => {
    const sbar = usePatientChartSbar(1)

    await sbar.loadConsegneSbar()

    expect(sbar.consegne.value.map((c) => c.id)).toEqual([1])
    expect(sbar.consegneLoaded.value).toBe(true)
    expect(consegneSbarApi.listConsegneSbar).toHaveBeenCalledWith({
      limit: 200,
    })
  })

  it('does not refetch once loaded unless forced', async () => {
    const sbar = usePatientChartSbar(1)
    await sbar.loadConsegneSbar()

    await sbar.loadConsegneSbar()

    expect(consegneSbarApi.listConsegneSbar).toHaveBeenCalledOnce()
  })

  it('refetches when force is true', async () => {
    const sbar = usePatientChartSbar(1)
    await sbar.loadConsegneSbar()

    await sbar.loadConsegneSbar(true)

    expect(consegneSbarApi.listConsegneSbar).toHaveBeenCalledTimes(2)
  })
})
