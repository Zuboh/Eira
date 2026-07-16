import type { PazienteUpdatePayload } from '@/api/pazienti'
import type { VoceDiarioCedemaCreatePayload } from '@/api/diarioCedema'
import type { ValutazioneConleyCreatePayload, ValutazioneNortonCreatePayload } from '@/api/valutazioni'

export type CedemaForm = VoceDiarioCedemaCreatePayload
export type NortonForm = ValutazioneNortonCreatePayload
export type ConleyForm = ValutazioneConleyCreatePayload
export type PatientEditForm = Required<Pick<PazienteUpdatePayload, 'letto' | 'diagnosi_ingresso' | 'dimesso'>>
