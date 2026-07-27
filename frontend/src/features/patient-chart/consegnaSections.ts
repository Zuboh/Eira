import type { GenericConsegnaKind } from '@/features/patient-chart/types'

export type ConsegnaSection = {
  key: string
  sigla: string
  label: string
  hint: string
  required: boolean
  copyForward: boolean
  aliases: string[]
}

export type ParsedConsegna = {
  values: Record<string, string>
  hasOrphanText: boolean
}

const SBAR_SECTIONS: ConsegnaSection[] = [
  {
    key: 'situation',
    sigla: 'S',
    label: 'Situation',
    hint: 'motivo della consegna, cosa sta succedendo adesso',
    required: true,
    copyForward: false,
    aliases: ['s', 'situation', 'situazione'],
  },
  {
    key: 'background',
    sigla: 'B',
    label: 'Background',
    hint: 'anamnesi, diagnosi di ingresso, terapia in corso',
    required: true,
    copyForward: true,
    aliases: ['b', 'background', 'contesto'],
  },
  {
    key: 'assessment',
    sigla: 'A',
    label: 'Assessment',
    hint: 'valutazione clinica: parametri, segni, evoluzione nel turno',
    required: true,
    copyForward: false,
    aliases: ['a', 'assessment', 'valutazione'],
  },
  {
    key: 'recommendation',
    sigla: 'R',
    label: 'Recommendation',
    hint: 'cosa deve fare il turno successivo, entro quando',
    required: true,
    copyForward: false,
    aliases: ['r', 'recommendation', 'raccomandazione', 'raccomandazioni'],
  },
]

const CEDEMA_SECTIONS: ConsegnaSection[] = [
  {
    key: 'coscienza',
    sigla: 'C',
    label: 'Coscienza',
    hint: 'stato di vigilanza, orientamento, collaborazione',
    required: true,
    copyForward: true,
    aliases: ['c', 'coscienza'],
  },
  {
    key: 'emotivita',
    sigla: 'E',
    label: 'Emotività',
    hint: 'tono dell’umore, ansia, agitazione, rapporto con i familiari',
    required: true,
    copyForward: false,
    aliases: ['e', 'emotivita'],
  },
  {
    key: 'dolore',
    sigla: 'D',
    label: 'Dolore',
    hint: 'sede, intensità (NRS), terapia antalgica e risposta',
    required: true,
    copyForward: false,
    aliases: ['d', 'dolore'],
  },
  {
    key: 'emodinamica',
    sigla: 'E',
    label: 'Emodinamica',
    hint: 'pressione, frequenza, saturazione, accessi venosi, infusioni',
    required: true,
    copyForward: false,
    aliases: ['e', 'emodinamica'],
  },
  {
    key: 'mobilizzazione',
    sigla: 'M',
    label: 'Mobilizzazione',
    hint: 'autonomia, ausili, cambi posturale, rischio lesioni',
    required: true,
    copyForward: true,
    aliases: ['m', 'mobilizzazione'],
  },
  {
    key: 'allert',
    sigla: 'A',
    label: 'Allert',
    hint: 'segnalazioni da non perdere: allergie, cadute, isolamento',
    required: true,
    copyForward: false,
    aliases: ['a', 'allert', 'alert'],
  },
]

/**
 * Marker di sezione: sigla o etichetta estesa **ancorata a inizio riga**,
 * seguita da `:`, `-` o `)`. L'ancoraggio evita che "riferisce dolore: 7/10"
 * apra la sezione Dolore a metà frase.
 */
const MARKER_LINE = /^[ \t]*([A-Za-zÀ-ÖØ-öø-ÿ]+)[ \t]*[:\-)][ \t]?(.*)$/

export function sectionsFor(tipo: GenericConsegnaKind): ConsegnaSection[] {
  return tipo === 'sbar' ? SBAR_SECTIONS : CEDEMA_SECTIONS
}

function normalizeToken(token: string) {
  return token
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function stripCarriageReturns(text: string) {
  return text.replace(/\r/g, '')
}

export function buildScaffold(tipo: GenericConsegnaKind) {
  return sectionsFor(tipo)
    .map((section) => `${section.sigla}:`)
    .join('\n')
}

/**
 * Vero se il testo è vuoto o è uno scaffold ancora da compilare (di uno
 * qualsiasi dei due tipi). Il chiamante lo usa per non sovrascrivere lavoro
 * reale quando reinserisce lo scaffold al cambio tipo.
 */
export function isPristineScaffold(testo: string) {
  const lines = stripCarriageReturns(testo)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) return true

  const knownAliases = new Set(
    [...SBAR_SECTIONS, ...CEDEMA_SECTIONS].flatMap(
      (section) => section.aliases,
    ),
  )

  return lines.every((line) => {
    const match = MARKER_LINE.exec(line)
    if (!match || match[2].trim()) return false
    return knownAliases.has(normalizeToken(match[1]))
  })
}

export function parseConsegnaText(
  testo: string,
  tipo: GenericConsegnaKind,
): ParsedConsegna {
  const sections = sectionsFor(tipo)
  const collected = new Map<string, string[]>()
  const preamble: string[] = []
  let current: string[] = preamble

  for (const line of stripCarriageReturns(testo).split('\n')) {
    const match = MARKER_LINE.exec(line)
    const token = match ? normalizeToken(match[1]) : null
    // Una sigla ambigua (le due E di CEDEMA) va alla prima sezione candidata
    // non ancora aperta; un'etichetta estesa è già univoca.
    const section = token
      ? sections.find(
          (candidate) =>
            candidate.aliases.includes(token) && !collected.has(candidate.key),
        )
      : undefined

    if (section && match) {
      current = [match[2]]
      collected.set(section.key, current)
      continue
    }

    current.push(line)
  }

  const orphanText = preamble.join('\n').trim()
  const values: Record<string, string> = {}

  for (const section of sections) {
    values[section.key] = (collected.get(section.key) ?? []).join('\n').trim()
  }

  if (orphanText) {
    const first = sections[0].key
    values[first] = values[first]
      ? `${orphanText}\n${values[first]}`
      : orphanText
  }

  return { values, hasOrphanText: Boolean(orphanText) }
}

type SectionMarker = { key: string; line: number }

/**
 * Righe che aprono una sezione, con la stessa regola di ambiguita' usata da
 * `parseConsegnaText`: una sigla ripetuta (le due E di CEDEMA) va alla prima
 * sezione candidata non ancora aperta.
 */
function scanMarkers(lines: string[], sections: ConsegnaSection[]) {
  const seen = new Set<string>()
  const markers: SectionMarker[] = []

  lines.forEach((line, index) => {
    const match = MARKER_LINE.exec(line)
    if (!match) return
    const token = normalizeToken(match[1])
    const section = sections.find(
      (candidate) =>
        candidate.aliases.includes(token) && !seen.has(candidate.key),
    )
    if (!section) return
    seen.add(section.key)
    markers.push({ key: section.key, line: index })
  })

  return markers
}

/**
 * Sostituisce **solo** le righe della sezione richiesta, lasciando il resto del
 * testo identico. Serve ai riempimenti assistiti (quick fill, copia dalla
 * consegna precedente): riserializzare tutto rimescolerebbe il testo orfano e
 * riscriverebbe righe che l'utente non ha chiesto di toccare.
 *
 * Se la sigla non e' presente, la inserisce nella posizione d'ordine della
 * sezione — cosi' i riempimenti materializzano lo scaffold come prima.
 */
export function replaceSection(
  testo: string,
  tipo: GenericConsegnaKind,
  key: string,
  value: string,
) {
  const sections = sectionsFor(tipo)
  const orderOf = (sectionKey: string) =>
    sections.findIndex((candidate) => candidate.key === sectionKey)

  const order = orderOf(key)
  if (order === -1) return testo

  const section = sections[order]
  const block = `${section.sigla}: ${value}`.trimEnd()
  const lines = stripCarriageReturns(testo).split('\n')
  const markers = scanMarkers(lines, sections)

  const own = markers.find((marker) => marker.key === key)
  if (own) {
    const next = markers.find((marker) => marker.line > own.line)
    const end = next ? next.line : lines.length
    lines.splice(own.line, end - own.line, block)
    return lines.join('\n')
  }

  const following = markers.find((marker) => orderOf(marker.key) > order)
  if (following) {
    lines.splice(following.line, 0, block)
    return lines.join('\n')
  }

  const head = lines.join('\n').trimEnd()
  return head ? `${head}\n${block}` : block
}

export function serializeToSigle(
  values: Record<string, string>,
  tipo: GenericConsegnaKind,
) {
  return sectionsFor(tipo)
    .map((section) => {
      const value = (values[section.key] ?? '').trim()
      return value ? `${section.sigla}: ${value}` : `${section.sigla}:`
    })
    .join('\n')
}

export function findEmptySections(
  values: Record<string, string>,
  tipo: GenericConsegnaKind,
) {
  return sectionsFor(tipo).filter(
    (section) => section.required && !(values[section.key] ?? '').trim(),
  )
}
