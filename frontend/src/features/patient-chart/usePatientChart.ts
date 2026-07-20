import { computed, unref, type MaybeRef } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { buildClinicalTimeline } from '@/features/patient-chart/timeline'
import { usePatientChartDialogs } from '@/features/patient-chart/usePatientChartDialogs'
import { usePatientChartQueries } from '@/features/patient-chart/usePatientChartQueries'

export function usePatientChart(pazienteId: MaybeRef<number>) {
  const auth = useAuthStore()
  const currentPazienteId = computed(() => unref(pazienteId))
  const ruolo = computed(() => auth.ruolo)

  const chart = usePatientChartQueries(currentPazienteId, ruolo)
  const dialogs = usePatientChartDialogs({
    pazienteId: currentPazienteId,
    paziente: chart.paziente,
    error: chart.error,
    assegnazioni: chart.assegnazioni,
    reloadTimeline: chart.reloadTimeline,
    reloadValutazioni: chart.reloadValutazioni,
    reloadParametriVitali: chart.reloadParametriVitali,
  })

  const canEditPatient = computed(() => ruolo.value === 'caposala')
  const canCreateClinicalEntries = computed(() => ruolo.value === 'infermiere')
  const timeline = computed(() =>
    buildClinicalTimeline(chart.cedema.value, chart.sbar.value),
  )

  return {
    paziente: chart.paziente,
    error: chart.error,
    loading: chart.loading,
    timeline,
    norton: chart.norton,
    conley: chart.conley,
    parametriVitali: chart.parametriVitali,
    assegnazioni: chart.assegnazioni,
    editing: dialogs.editing,
    editForm: dialogs.editForm,
    consegnaDrawer: dialogs.consegnaDrawer,
    consegnaSaving: dialogs.consegnaSaving,
    consegnaForm: dialogs.consegnaForm,
    consegnaInsight: dialogs.consegnaInsight,
    nortonDialog: dialogs.nortonDialog,
    nortonSaving: dialogs.nortonSaving,
    nortonForm: dialogs.nortonForm,
    conleyDialog: dialogs.conleyDialog,
    conleySaving: dialogs.conleySaving,
    conleyForm: dialogs.conleyForm,
    parametriDialog: dialogs.parametriDialog,
    parametriSaving: dialogs.parametriSaving,
    parametriForm: dialogs.parametriForm,
    canEditPatient,
    canCreateClinicalEntries,
    load: chart.load,
    apriEdit: dialogs.apriEdit,
    salvaEdit: dialogs.salvaEdit,
    apriConsegna: dialogs.apriConsegna,
    salvaConsegna: dialogs.salvaConsegna,
    apriNorton: dialogs.apriNorton,
    salvaNorton: dialogs.salvaNorton,
    apriConley: dialogs.apriConley,
    salvaConley: dialogs.salvaConley,
    apriParametri: dialogs.apriParametri,
    salvaParametri: dialogs.salvaParametri,
  }
}
