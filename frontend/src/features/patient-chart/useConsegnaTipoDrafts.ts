import { ref, type Ref } from 'vue'
import { buildScaffold } from '@/features/patient-chart/consegnaSections'
import type {
  GenericConsegnaForm,
  GenericConsegnaKind,
} from '@/features/patient-chart/types'

/**
 * Tiene una bozza di testo per ciascun tipo di consegna.
 *
 * SBAR e CEDEMA non sono due formattazioni dello stesso testo: 4 sezioni contro
 * 6, contenuti clinici diversi, e le sigle si sovrappongono (la A di Assessment
 * e' la A di Allert). Riparsare lo stesso testo col modello dell'altro tipo
 * ricollocherebbe contenuto clinico in sezioni sbagliate, in silenzio.
 *
 * Quindi il cambio tipo non converte — ma non butta: il testo del tipo che si
 * lascia resta qui e torna intatto se si torna indietro. Si salva solo il testo
 * del tipo attivo.
 */
export function useConsegnaTipoDrafts(form: Ref<GenericConsegnaForm>) {
  const bozze = ref<Record<GenericConsegnaKind, string | null>>({
    sbar: null,
    cedema: null,
  })

  function cambiaTipo(tipo: GenericConsegnaKind) {
    if (tipo === form.value.tipo) return

    bozze.value[form.value.tipo] = form.value.testo
    form.value.tipo = tipo
    form.value.testo = bozze.value[tipo] ?? buildScaffold(tipo)
  }

  /** Da chiamare a ogni apertura del dialog: una bozza ereditata riapparirebbe
   *  sulla consegna di un altro paziente. */
  function resetBozze() {
    bozze.value = { sbar: null, cedema: null }
  }

  return { cambiaTipo, resetBozze }
}
