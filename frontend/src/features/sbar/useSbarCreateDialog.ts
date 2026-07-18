import { ref, unref, type MaybeRef } from 'vue'
import { createConsegnaSbar } from '@/api/consegneSbar'
import { getMieAssegnazioni } from '@/api/turni'
import {
  canCreateConsegnaPayload,
  createEmptyConsegnaSbarForm,
  toCreateConsegnaPayload,
} from '@/features/sbar/form'
import type { AssegnazioneTurno, ConsegnaSbarForm } from '@/features/sbar/types'

export function useSbarCreateDialog(options: {
  pazienteId: MaybeRef<number>
  onCreated: () => Promise<void> | void
}) {
  const dialogOpen = ref(false)
  const saving = ref(false)
  const error = ref('')
  const assegnazioni = ref<AssegnazioneTurno[]>([])
  const form = ref<ConsegnaSbarForm>(createEmptyConsegnaSbarForm())

  async function loadAssegnazioniIfNeeded() {
    if (assegnazioni.value.length > 0) return

    const { data } = await getMieAssegnazioni()
    assegnazioni.value = data
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
