import { sectionsFor } from '@/features/patient-chart/consegnaSections'
import type { ConsegnaSbar } from '@/api/consegneSbar'
import type { VoceDiarioSoapie } from '@/api/diarioSoapie'
import type { ClinicalTimelineEntry } from '@/features/patient-chart/types'

export function normalizeSoapieEntry(
  entry: VoceDiarioSoapie,
): ClinicalTimelineEntry {
  return {
    id: `soapie-${entry.id}`,
    sourceId: entry.id,
    tipo: 'soapie',
    timestamp: entry.timestamp,
    autoreId: entry.autore_id,
    title: 'Consegna SOAPIE',
    sections: sectionsFor('soapie')
      .map((s) => ({
        label: s.label,
        value: String(entry[s.key as keyof VoceDiarioSoapie] ?? ''),
      }))
      .filter((s) => s.value.trim()),
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
    sections: sectionsFor('sbar')
      .map((s) => ({
        label: s.label,
        value: String(entry[s.key as keyof ConsegnaSbar] ?? ''),
      }))
      .filter((s) => s.value.trim()),
    priorita: entry.priorita,
  }
}

export function buildClinicalTimeline(
  soapie: VoceDiarioSoapie[],
  sbar: ConsegnaSbar[],
): ClinicalTimelineEntry[] {
  return [
    ...soapie.map(normalizeSoapieEntry),
    ...sbar.map(normalizeSbarEntry),
  ].sort(
    (left, right) =>
      new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
  )
}
