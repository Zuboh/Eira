import type {
  ConsegnaSbar,
  ConsegnaSbarCreatePayload,
  ConsegnaSbarForm,
  ConsegnaSbarUpdatePayload,
  PrioritaOption,
} from '@/features/sbar/types'

export const prioritaOptions: PrioritaOption[] = [
  { value: 'normale', label: 'Normale' },
  { value: 'urgente', label: 'Urgente' },
]

export function createEmptyConsegnaSbarForm(): ConsegnaSbarForm {
  return {
    paziente_id: null,
    turno_id: null,
    situation: '',
    background: '',
    assessment: '',
    recommendation: '',
    priorita: 'normale',
  }
}

export function createFormFromConsegna(consegna: ConsegnaSbar): ConsegnaSbarForm {
  return {
    paziente_id: consegna.paziente_id,
    turno_id: consegna.turno_id,
    situation: consegna.situation,
    background: consegna.background,
    assessment: consegna.assessment,
    recommendation: consegna.recommendation,
    priorita: consegna.priorita,
  }
}

export function canCreateConsegnaPayload(
  form: ConsegnaSbarForm,
): form is ConsegnaSbarForm & { paziente_id: number; turno_id: number } {
  return form.paziente_id !== null && form.turno_id !== null
}

export function toCreateConsegnaPayload(
  form: ConsegnaSbarForm & { paziente_id: number; turno_id: number },
): ConsegnaSbarCreatePayload {
  return {
    paziente_id: form.paziente_id,
    turno_id: form.turno_id,
    situation: form.situation,
    background: form.background,
    assessment: form.assessment,
    recommendation: form.recommendation,
    priorita: form.priorita,
  }
}

export function toUpdateConsegnaPayload(form: ConsegnaSbarForm): ConsegnaSbarUpdatePayload {
  return {
    situation: form.situation,
    background: form.background,
    assessment: form.assessment,
    recommendation: form.recommendation,
    priorita: form.priorita,
  }
}
