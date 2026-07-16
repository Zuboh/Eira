import { computed, ref } from 'vue'
import {
  createTemporaryPassword,
  listUtenti,
  updateUtente,
  type StatoUtente,
  type Utente,
} from '@/api/utenti'

export const staffFilters: { value: StatoUtente; label: string }[] = [
  { value: 'in_attesa', label: 'In attesa' },
  { value: 'attivo', label: 'Attivi' },
  { value: 'disattivato', label: 'Disattivati' },
]

export function useStaffWorkflow() {
  const utenti = ref<Utente[]>([])
  const filtro = ref<StatoUtente>('in_attesa')
  const loading = ref(false)
  const resetLoadingId = ref<number | null>(null)
  const error = ref('')
  const temporaryPassword = ref<string | null>(null)

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
    filtri: staffFilters,
    filtrati,
    load,
    approva,
    reimpostaPassword,
    copiaPassword,
  }
}
