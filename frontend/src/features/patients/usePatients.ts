import { computed, ref } from 'vue'
import { createPaziente, listPazienti, type Paziente } from '@/api/pazienti'
import { useAuthStore } from '@/stores/auth'
import { createEmptyNewPatientForm, toPatientCreatePayload } from '@/features/patients/form'
import type { NewPatientForm } from '@/features/patients/types'

export function usePatients() {
  const auth = useAuthStore()

  const pazienti = ref<Paziente[]>([])
  const loading = ref(false)
  const error = ref('')
  const dialogOpen = ref(false)
  const saving = ref(false)
  const form = ref<NewPatientForm>(createEmptyNewPatientForm())

  const canCreatePatient = computed(() => auth.ruolo === 'caposala')
  const isNurse = computed(() => auth.ruolo === 'infermiere')

  async function load() {
    error.value = ''
    loading.value = true
    try {
      const { data } = await listPazienti()
      pazienti.value = data
    } catch {
      error.value = 'Impossibile caricare i pazienti.'
    } finally {
      loading.value = false
    }
  }

  function apriNuovo() {
    form.value = createEmptyNewPatientForm()
    dialogOpen.value = true
  }

  async function salva() {
    if (!auth.user?.reparto_id) return

    const payload = toPatientCreatePayload(form.value, auth.user.reparto_id)
    if (!payload) return

    saving.value = true
    error.value = ''
    try {
      await createPaziente(payload)
      dialogOpen.value = false
      await load()
    } catch {
      error.value = 'Impossibile creare il paziente.'
    } finally {
      saving.value = false
    }
  }

  return {
    pazienti,
    loading,
    error,
    dialogOpen,
    saving,
    form,
    canCreatePatient,
    isNurse,
    load,
    apriNuovo,
    salva,
  }
}
