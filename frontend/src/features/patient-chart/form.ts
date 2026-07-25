import type { Paziente } from '@/api/pazienti'
import { prioritaOptions } from '@/features/sbar/form'
import { todayIsoDate } from '@/features/sbar/turnoOptions'
import {
  findEmptySections,
  isPristineScaffold,
  parseConsegnaText,
} from '@/features/patient-chart/consegnaSections'
import type {
  CedemaNarrativeSource,
  GenericConsegnaForm,
  NortonForm,
  ConleyForm,
  ParametriVitaliForm,
  PatientEditForm,
  SbarNarrativeSource,
  StatoCoscienzaOption,
} from '@/features/patient-chart/types'

export const statoCoscienzaOptions: StatoCoscienzaOption[] = [
  { value: 'vigile', label: 'Vigile' },
  { value: 'verbale', label: 'Risponde alla voce' },
  { value: 'dolore', label: 'Risponde al dolore' },
  { value: 'coma', label: 'Coma' },
]

export { prioritaOptions }

export function createEmptyGenericConsegnaForm(): GenericConsegnaForm {
  return {
    paziente_id: null,
    tipo: 'sbar',
    data: todayIsoDate(),
    turno_id: null,
    priorita: 'normale',
    testo: '',
  }
}

export function createEmptyNortonForm(): NortonForm {
  return {
    data_valutazione: todayIsoDate(),
    condizioni_generali: 1,
    stato_mentale: 1,
    attivita: 1,
    mobilita: 1,
    incontinenza: 1,
  }
}

export function createEmptyConleyForm(): ConleyForm {
  return {
    data_valutazione: todayIsoDate(),
    storia_cadute: 0,
    deficit_visivo: 0,
    alterazione_eliminazione: 0,
    agitazione: 0,
    deficit_vista_osservato: 0,
    andatura_alterata: 0,
  }
}

export function createEmptyParametriVitaliForm(): ParametriVitaliForm {
  return {
    turno_id: null,
    temperatura: 36.5,
    frequenza_cardiaca: 80,
    pressione_sistolica: 120,
    pressione_diastolica: 80,
    frequenza_respiratoria: 16,
    saturazione_o2: 98,
    scala_dolore: 0,
    stato_coscienza: 'vigile',
    ossigeno: false,
    note: '',
  }
}

export function createPatientEditForm(paziente: Paziente): PatientEditForm {
  return {
    letto: paziente.letto,
    diagnosi_ingresso: paziente.diagnosi_ingresso,
    dimesso: paziente.dimesso,
  }
}

export function toCedemaPayload(form: GenericConsegnaForm) {
  const { values } = parseConsegnaText(form.testo, 'cedema')

  return {
    turno_id: form.turno_id,
    coscienza: values.coscienza,
    emotivita: values.emotivita,
    dolore: values.dolore,
    emodinamica: values.emodinamica,
    mobilizzazione: values.mobilizzazione,
    allert: values.allert,
  }
}

export function toSbarPayload(
  pazienteId: number,
  form: GenericConsegnaForm & { turno_id: number },
) {
  const { values } = parseConsegnaText(form.testo, 'sbar')

  return {
    paziente_id: pazienteId,
    turno_id: form.turno_id,
    situation: values.situation,
    background: values.background,
    assessment: values.assessment,
    recommendation: values.recommendation,
    priorita: form.priorita,
  }
}

/**
 * Validazione unica per le due viste che creano una consegna. Restituisce il
 * messaggio da mostrare, oppure `null` se il form e' salvabile. Le sezioni
 * vuote bloccano il salvataggio: il backend le rifiuta comunque (min_length=1)
 * e un campo vuoto in consegna e' ambiguo — non compilato o niente da segnalare.
 */
export function validateConsegnaForm(form: GenericConsegnaForm): string | null {
  if (!form.testo.trim() || isPristineScaffold(form.testo)) {
    return 'Inserisci il testo della consegna.'
  }
  if (form.tipo === 'sbar' && form.turno_id === null) {
    return 'Seleziona una data con turno assegnato per una consegna SBAR.'
  }

  const { values } = parseConsegnaText(form.testo, form.tipo)
  const missing = findEmptySections(values, form.tipo)
  if (missing.length > 0) {
    const labels = missing.map((section) => section.label).join(', ')
    return `Completa le sezioni mancanti: ${labels}.`
  }

  return null
}

function uniqueNonEmpty(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

export function cedemaToNarrative(entry: CedemaNarrativeSource) {
  const sections = [
    ['Coscienza', entry.coscienza],
    ['Emotività', entry.emotivita],
    ['Dolore', entry.dolore],
    ['Emodinamica', entry.emodinamica],
    ['Mobilizzazione', entry.mobilizzazione],
    ['Allert', entry.allert],
  ] as const
  const values = uniqueNonEmpty(sections.map(([, value]) => value))
  if (values.length === 0) return ''
  if (values.length === 1) return values[0]
  return sections
    .filter(([, value]) => value.trim())
    .map(([label, value]) => `${label}: ${value.trim()}`)
    .join('\n')
}

export function sbarToNarrative(entry: SbarNarrativeSource) {
  return [
    ['Situation', entry.situation],
    ['Background', entry.background],
    ['Assessment', entry.assessment],
    ['Recommendation', entry.recommendation],
  ]
    .filter(([, value]) => value.trim())
    .map(([label, value]) => `${label}: ${value.trim()}`)
    .join('\n')
}
