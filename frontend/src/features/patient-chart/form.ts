import type {
  CedemaForm,
  ConleyForm,
  NortonForm,
  PatientEditForm,
} from '@/features/patient-chart/types'
import type { Paziente } from '@/api/pazienti'

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export function createEmptyCedemaForm(): CedemaForm {
  return {
    turno_id: null,
    coscienza: '',
    emotivita: '',
    dolore: '',
    emodinamica: '',
    mobilizzazione: '',
    allert: '',
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

export function createPatientEditForm(paziente: Paziente): PatientEditForm {
  return {
    letto: paziente.letto,
    diagnosi_ingresso: paziente.diagnosi_ingresso,
    dimesso: paziente.dimesso,
  }
}
