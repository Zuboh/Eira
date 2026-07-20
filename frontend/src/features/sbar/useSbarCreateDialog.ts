import { ref, unref, type MaybeRef } from 'vue'
import { createConsegnaSbar } from '@/api/consegneSbar'
import { getMieAssegnazioni, listTurni } from '@/api/turni'
import {
  canCreateConsegnaPayload,
  createEmptyConsegnaSbarForm,
  toCreateConsegnaPayload,
} from '@/features/sbar/form'
import {
  buildAssegnazioneTurnoOptions,
  turnoIdForDate,
  type AssegnazioneTurnoOption,
} from '@/features/sbar/turnoOptions'
import type { ConsegnaSbarForm } from '@/features/sbar/types'

export function useSbarCreateDialog(options: {
  pazienteId: MaybeRef<number>
  onCreated: () => Promise<void> | void
}) {
  const dialogOpen = ref(false)
  const saving = ref(false)
  const error = ref('')
  const assegnazioni = ref<AssegnazioneTurnoOption[]>([])
  const form = ref<ConsegnaSbarForm>(createEmptyConsegnaSbarForm())

  async function loadAssegnazioniIfNeeded() {
    if (assegnazioni.value.length > 0) return

    const [assegnazioniResponse, turniResponse] = await Promise.all([
      getMieAssegnazioni(),
      listTurni(),
    ])
    assegnazioni.value = buildAssegnazioneTurnoOptions(
      assegnazioniResponse.data,
      turniResponse.data,
    )
  }

  async function apri() {
    error.value = ''
    form.value = {
      ...createEmptyConsegnaSbarForm(),
      paziente_id: unref(options.pazienteId),
    }
    dialogOpen.value = true
    try {
      await loadAssegnazioniIfNeeded()
      form.value.turno_id = turnoIdForDate(assegnazioni.value, form.value.data)
    } catch {
      error.value = 'Impossibile caricare i turni assegnati.'
    }
  }

  async function salva() {
    if (!canCreateConsegnaPayload(form.value)) return

    saving.value = true
    error.value = ''
    try {
      await createConsegnaSbar(toCreateConsegnaPayload(form.value))
      dialogOpen.value = false
      await options.onCreated()
    } catch {
      error.value = 'Impossibile salvare la consegna.'
    } finally {
      saving.value = false
    }
  }

  return {
    dialogOpen,
    saving,
    error,
    assegnazioni,
    form,
    apri,
    salva,
  }
}
