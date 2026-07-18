import { computed, ref } from 'vue'
import {
  createTemporaryPassword,
  createUtente,
  listUtenti,
  updateUtente,
  type StatoUtente,
  type Utente,
} from '@/api/utenti'
import { useAuthStore } from '@/stores/auth'
import type { NewStaffForm, StaffFilterOption } from '@/features/staff/types'

export const staffFilters: StaffFilterOption[] = [
  { value: 'in_attesa', label: 'In attesa' },
  { value: 'attivo', label: 'Attivi' },
  { value: 'disattivato', label: 'Disattivati' },
]

function createEmptyNewStaffForm(): NewStaffForm {
  return {
    nome: '',
    cognome: '',
    email: '',
    password: '',
    ruolo: 'infermiere',
  }
}

export function useStaffWorkflow() {
  const auth = useAuthStore()
  const utenti = ref<Utente[]>([])
  const filtro = ref<StatoUtente>('in_attesa')
  const loading = ref(false)
  const resetLoadingId = ref<number | null>(null)
  const error = ref('')
  const temporaryPassword = ref<string | null>(null)
  const newDialogOpen = ref(false)
  const newSaving = ref(false)
  const newForm = ref<NewStaffForm>(createEmptyNewStaffForm())

  const filtrati = computed(() => utenti.value.filter((u) => u.stato === filtro.value))

  async function load() {
    error.value = ''
    loading.value = true
    try {
      const { data } = await listUtenti()
      utenti.value = data
    } catch {
      error.value = 'Impossibile caricare il personale.'
    } finally {
      loading.value = false
    }
  }

  function apriNuovo() {
    newForm.value = createEmptyNewStaffForm()
    newDialogOpen.value = true
    temporaryPassword.value = null
    error.value = ''
  }

  async function salvaNuovo() {
    if (auth.user === null) return

    error.value = ''
    newSaving.value = true
    try {
      await createUtente({
        ...newForm.value,
        reparto_id: auth.user.reparto_id,
      })
      newDialogOpen.value = false
      filtro.value = 'attivo'
      await load()
    } catch {
      error.value = 'Impossibile creare l\'utente.'
    } finally {
      newSaving.value = false
    }
  }

  async function approva(utente: Utente) {
    try {
      await updateUtente(utente.id, { stato: 'attivo' })
      utente.stato = 'attivo'
    } catch {
      error.value = 'Impossibile approvare l\'utente.'
    }
  }

  async function reimpostaPassword(utente: Utente) {
    error.value = ''
    resetLoadingId.value = utente.id
    temporaryPassword.value = null
    try {
      const { data } = await createTemporaryPassword(utente.id)
      temporaryPassword.value = data.temporary_password
    } catch {
      error.value = 'Impossibile generare la password temporanea.'
    } finally {
      resetLoadingId.value = null
    }
  }

  async function copiaPassword() {
    if (!temporaryPassword.value) return
    try {
      await navigator.clipboard.writeText(temporaryPassword.value)
    } catch {
      error.value = 'Impossibile copiare la password.'
    }
  }

  return {
    utenti,
    filtro,
    loading,
    resetLoadingId,
    error,
    temporaryPassword,
    newDialogOpen,
    newSaving,
    newForm,
    filtri: staffFilters,
    filtrati,
    load,
    apriNuovo,
    salvaNuovo,
    approva,
    reimpostaPassword,
    copiaPassword,
  }
}
