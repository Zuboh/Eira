import type { Paziente } from '@/api/pazienti'
import { prioritaOptions } from '@/features/sbar/form'
import type {
  CedemaNarrativeSource,
  ClinicalInsight,
  GenericConsegnaForm,
  GenericConsegnaKind,
  NortonForm,
  ConleyForm,
  ParametriVitaliForm,
  PatientEditForm,
  SbarNarrativeSource,
  StatoCoscienzaOption,
} from '@/features/patient-chart/types'

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export const statoCoscienzaOptions: StatoCoscienzaOption[] = [
  { value: 'vigile', label: 'Vigile' },
  { value: 'verbale', label: 'Risponde alla voce' },
  { value: 'dolore', label: 'Risponde al dolore' },
  { value: 'coma', label: 'Coma' },
]

export { prioritaOptions }

export function createEmptyGenericConsegnaForm(): GenericConsegnaForm {
  return {
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

function normalizeWhitespace(value: string) {
  return value.replace(/\r/g, '').trim()
}

function extractSections(text: string, labels: string[]) {
  const content = normalizeWhitespace(text)
  const lower = content.toLowerCase()
  const sections: Record<string, string> = {}

  for (let index = 0; index < labels.length; index += 1) {
    const label = labels[index]
    const marker = `${label.toLowerCase()}:`
    const start = lower.indexOf(marker)
    if (start === -1) continue

    const valueStart = start + marker.length
    let end = content.length
    for (let nextIndex = index + 1; nextIndex < labels.length; nextIndex += 1) {
      const nextMarker = `${labels[nextIndex].toLowerCase()}:`
      const candidate = lower.indexOf(nextMarker, valueStart)
      if (candidate !== -1 && candidate < end) end = candidate
    }
    sections[label] = content.slice(valueStart, end).trim()
  }

  return sections
}

export function toCedemaPayload(form: GenericConsegnaForm) {
  const sections = extractSections(form.testo, [
    'coscienza',
    'emotivita',
    'dolore',
    'emodinamica',
    'mobilizzazione',
    'allert',
  ])

  return {
    turno_id: form.turno_id,
    coscienza: sections.coscienza ?? '',
    emotivita: sections.emotivita ?? '',
    dolore: sections.dolore ?? '',
    emodinamica: sections.emodinamica ?? '',
    mobilizzazione: sections.mobilizzazione ?? '',
    allert: sections.allert ?? normalizeWhitespace(form.testo),
  }
}

export function toSbarPayload(
  pazienteId: number,
  form: GenericConsegnaForm & { turno_id: number },
) {
  const sections = extractSections(form.testo, [
    'situation',
    'background',
    'assessment',
    'recommendation',
  ])
  const paragraphs = normalizeWhitespace(form.testo)
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)

  const situation =
    sections.situation ?? paragraphs[0] ?? normalizeWhitespace(form.testo)
  const background =
    sections.background ?? paragraphs[1] ?? 'Contesto clinico non specificato.'
  const assessment =
    sections.assessment ?? paragraphs[2] ?? 'Valutazione in corso.'
  const recommendation =
    sections.recommendation ??
    paragraphs[3] ??
    'Monitorare e rivalutare nel prossimo turno.'

  return {
    paziente_id: pazienteId,
    turno_id: form.turno_id,
    situation,
    background,
    assessment,
    recommendation,
    priorita: form.priorita,
  }
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

const KEYWORD_TAGS: Array<{ tag: string; pattern: RegExp }> = [
  { tag: 'Dolore', pattern: /dolor|algia/i },
  { tag: 'Respirazione', pattern: /respiro|dispnea|satur/i },
  { tag: 'Emodinamica', pattern: /pressione|tachic|ipotens|emodinam/i },
  { tag: 'Coscienza', pattern: /vigile|sonnol|coscienza|agit/i },
  { tag: 'Mobilizzazione', pattern: /mobil|deambul|cammin/i },
  { tag: 'Terapia', pattern: /terapia|farmac|antibiot/i },
  { tag: 'Urgenza', pattern: /urgente|subito|immediato/i },
]

export function buildClinicalInsight(
  testo: string,
  tipo: GenericConsegnaKind,
): ClinicalInsight | null {
  const content = normalizeWhitespace(testo)
  if (!content) return null

  const firstSentence = content.split(/(?<=[.!?])\s+/)[0] ?? content
  const tags = KEYWORD_TAGS.filter(({ pattern }) => pattern.test(content)).map(
    ({ tag }) => tag,
  )

  const prefix = tipo === 'sbar' ? 'Bozza SBAR' : 'Bozza diario'
  return {
    summary: `${prefix}: ${firstSentence.slice(0, 140)}`,
    tags,
  }
}
