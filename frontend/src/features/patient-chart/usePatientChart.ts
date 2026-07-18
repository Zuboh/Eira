import { computed, unref, type MaybeRef } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePatientChartDialogs } from '@/features/patient-chart/usePatientChartDialogs'
import { usePatientChartQueries } from '@/features/patient-chart/usePatientChartQueries'
import { usePatientChartSbar } from '@/features/patient-chart/usePatientChartSbar'
import { useSbarCreateDialog } from '@/features/sbar/useSbarCreateDialog'

export function usePatientChart(pazienteId: MaybeRef<number>) {
  const auth = useAuthStore()
  const currentPazienteId = computed(() => unref(pazienteId))
  const ruolo = computed(() => auth.ruolo)

  const chart = usePatientChartQueries(currentPazienteId, ruolo)
  const sbar = usePatientChartSbar(currentPazienteId)
  const sbarCreateDialog = useSbarCreateDialog({
    pazienteId: currentPazienteId,
    onCreated: () => sbar.loadConsegneSbar(true),
  })
  const dialogs = usePatientChartDialogs({
    pazienteId: currentPazienteId,
    paziente: chart.paziente,
    error: chart.error,
    reloadCedema: chart.reloadCedema,
    reloadValutazioni: chart.reloadValutazioni,
  })

  const canEditPatient = computed(() => ruolo.value === 'caposala')
  const canCreateClinicalEntries = computed(() => ruolo.value === 'infermiere')

  async function loadConsegneSbar(force = false) {
    try {
      await sbar.loadConsegneSbar(force)
    } catch {
      chart.error.value = 'Impossibile caricare lo storico SBAR.'
      throw new Error(chart.error.value)
    }
  }

  return {
    paziente: chart.paziente,
    error: chart.error,
    loading: chart.loading,
    cedema: chart.cedema,
    norton: chart.norton,
    conley: chart.conley,
    consegne: sbar.consegne,
    consegneLoaded: sbar.consegneLoaded,
    assegnazioni: chart.assegnazioni,
    editing: dialogs.editing,
    editForm: dialogs.editForm,
    cedemaDialog: dialogs.cedemaDialog,
    cedemaSaving: dialogs.cedemaSaving,
    cedemaForm: dialogs.cedemaForm,
    nortonDialog: dialogs.nortonDialog,
    nortonSaving: dialogs.nortonSaving,
    nortonForm: dialogs.nortonForm,
    conleyDialog: dialogs.conleyDialog,
    conleySaving: dialogs.conleySaving,
    conleyForm: dialogs.conleyForm,
    sbarDialog: sbarCreateDialog.dialogOpen,
    sbarSaving: sbarCreateDialog.saving,
    sbarForm: sbarCreateDialog.form,
    sbarAssegnazioni: sbarCreateDialog.assegnazioni,
    sbarCreateError: sbarCreateDialog.error,
    canEditPatient,
    canCreateClinicalEntries,
    load: chart.load,
    loadConsegneSbar,
    apriEdit: dialogs.apriEdit,
    salvaEdit: dialogs.salvaEdit,
    apriCedema: dialogs.apriCedema,
    salvaCedema: dialogs.salvaCedema,
    apriNorton: dialogs.apriNorton,
    salvaNorton: dialogs.salvaNorton,
    apriConley: dialogs.apriConley,
    salvaConley: dialogs.salvaConley,
    apriSbar: sbarCreateDialog.apri,
    salvaSbar: sbarCreateDialog.salva,
  }
}
