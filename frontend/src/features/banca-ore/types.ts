import type { BancaOre } from '@/api/bancaOre'
import type { UtenteTile } from '@/api/reparti'

export type BancaOreSectionProps = {
  bancaOre: BancaOre | null
  mese: string
  loading?: boolean
  error?: string
  infermieri?: UtenteTile[]
  infermiereId?: number | null
  showInfermiereSelect?: boolean
}

export type BancaOreSectionEmits = {
  previousMonth: []
  nextMonth: []
  'update:infermiereId': [value: number | null]
}
