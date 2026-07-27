import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useConsegnaTipoDrafts } from '@/features/patient-chart/useConsegnaTipoDrafts'
import { buildScaffold } from '@/features/patient-chart/consegnaSections'
import type { GenericConsegnaForm } from '@/features/patient-chart/types'

const SBAR_TESTO = 'S: dolore toracico\nB: BPCO\nA: stabile\nR: rivalutare'

function makeForm(overrides: Partial<GenericConsegnaForm> = {}) {
  return ref<GenericConsegnaForm>({
    paziente_id: 1,
    tipo: 'sbar',
    data: '2026-07-18',
    turno_id: 5,
    priorita: 'normale',
    testo: SBAR_TESTO,
    ...overrides,
  })
}

describe('useConsegnaTipoDrafts', () => {
  it('opens the new type on a clean scaffold', () => {
    const form = makeForm()
    const { cambiaTipo } = useConsegnaTipoDrafts(form)

    cambiaTipo('cedema')

    expect(form.value.tipo).toBe('cedema')
    expect(form.value.testo).toBe(buildScaffold('cedema'))
  })

  it('gives the previous text back when switching back', () => {
    const form = makeForm()
    const { cambiaTipo } = useConsegnaTipoDrafts(form)

    cambiaTipo('cedema')
    cambiaTipo('sbar')

    expect(form.value.testo).toBe(SBAR_TESTO)
  })

  it('keeps the last version of each type across several switches', () => {
    const form = makeForm()
    const { cambiaTipo } = useConsegnaTipoDrafts(form)

    cambiaTipo('cedema')
    form.value.testo = 'C: vigile\nE:\nD:\nE:\nM:\nA:'
    cambiaTipo('sbar')
    form.value.testo = `${SBAR_TESTO} entro le 22`
    cambiaTipo('cedema')

    expect(form.value.testo).toBe('C: vigile\nE:\nD:\nE:\nM:\nA:')

    cambiaTipo('sbar')

    expect(form.value.testo).toBe(`${SBAR_TESTO} entro le 22`)
  })

  it('is a no-op when the type does not change', () => {
    const form = makeForm()
    const { cambiaTipo } = useConsegnaTipoDrafts(form)

    cambiaTipo('sbar')

    expect(form.value.testo).toBe(SBAR_TESTO)
  })

  it('drops the drafts on reset, so they cannot leak into the next consegna', () => {
    const form = makeForm()
    const { cambiaTipo, resetBozze } = useConsegnaTipoDrafts(form)

    cambiaTipo('cedema')
    resetBozze()
    cambiaTipo('sbar')

    expect(form.value.testo).toBe(buildScaffold('sbar'))
  })
})
