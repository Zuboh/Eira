import type { ConsegnaSbar } from '@/api/consegneSbar'
import type { VoceDiarioCedema } from '@/api/diarioCedema'
import {
  cedemaToNarrative,
  sbarToNarrative,
} from '@/features/patient-chart/form'
import type { ClinicalTimelineEntry } from '@/features/patient-chart/types'

export function normalizeCedemaEntry(
  entry: VoceDiarioCedema,
): ClinicalTimelineEntry {
  return {
    id: `cedema-${entry.id}`,
    sourceId: entry.id,
    tipo: 'cedema',
    timestamp: entry.timestamp,
    autoreId: entry.autore_id,
    title: 'Consegna CEDEMA',
    body: cedemaToNarrative(entry),
  }
}

export function normalizeSbarEntry(entry: ConsegnaSbar): ClinicalTimelineEntry {
  return {
    id: `sbar-${entry.id}`,
    sourceId: entry.id,
    tipo: 'sbar',
    timestamp: entry.creata_il,
    autoreId: entry.autore_id,
    title: 'Consegna SBAR',
    body: sbarToNarrative(entry),
    priorita: entry.priorita,
  }
}

export function buildClinicalTimeline(
  cedema: VoceDiarioCedema[],
  sbar: ConsegnaSbar[],
): ClinicalTimelineEntry[] {
  return [
    ...cedema.map(normalizeCedemaEntry),
    ...sbar.map(normalizeSbarEntry),
  ].sort(
    (left, right) =>
      new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
  )
}
