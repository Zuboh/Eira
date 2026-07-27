import { onMounted, ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { changeTemporaryPassword } from '@/api/auth'
import type { TipoTurno } from '@/api/turni'
import {
  getTurnoOggiUtente,
  listReparti,
  listUtentiByReparto,
  type Reparto,
  type UtenteTile,
} from '@/api/reparti'
import { useAuthStore } from '@/stores/auth'
import {
  clearDeviceReparto,
  getDeviceRepartoId,
  getDeviceRepartoNome,
  setDeviceReparto,
} from '@/features/session/useDeviceReparto'

export type LoginStep = 'reparto' | 'tiles' | 'password' | 'change-password'
export type LoginFocusTarget = 'reparto' | 'tile' | 'password'

type LoginApiError = {
  response?: {
    status?: number
    data?: {
      detail?: string
    }
  }
}

type UseLoginFlowOptions = {
  focusFirstOf: (target: LoginFocusTarget) => Promise<void> | void
}

type UseLoginFlowResult = {
  step: Ref<LoginStep>
  reparti: Ref<Reparto[]>
  utenti: Ref<UtenteTile[]>
  selectedUtente: Ref<UtenteTile | null>
  password: Ref<string>
  temporaryPassword: Ref<string>
  newPassword: Ref<string>
  confirmPassword: Ref<string>
  error: Ref<string>
  success: Ref<string>
  loading: Ref<boolean>
  stepError: Ref<string>
  turnoOggi: Ref<TipoTurno | null>
  repartoNome: Ref<string | null>
  chooseReparto: (reparto: Reparto) => Promise<void>
  cambiaReparto: () => void
  selectUtente: (utente: UtenteTile) => Promise<void>
  tornaAiTile: () => void
  onSubmit: () => Promise<void>
  onChangeTemporaryPassword: () => Promise<void>
}

const TEMPORARY_PASSWORD_EXPIRED_MESSAGE =
  'Password temporanea scaduta. Chiedi alla caposala una nuova password temporanea.'

function getLoginErrorResponse(err: unknown): LoginApiError['response'] {
  return (err as LoginApiError)?.response
}

export function useLoginFlow({
  focusFirstOf,
}: UseLoginFlowOptions): UseLoginFlowResult {
  const step = ref<LoginStep>('reparto')
  const reparti = ref<Reparto[]>([])
  const utenti = ref<UtenteTile[]>([])
  const selectedUtente = ref<UtenteTile | null>(null)
  const password = ref('')
  const temporaryPassword = ref('')
  const newPassword = ref('')
  const confirmPassword = ref('')
  const error = ref('')
  const success = ref('')
  const loading = ref(false)
  const stepError = ref('')
  const turnoOggi = ref<TipoTurno | null>(null)
  const repartoNome = ref<string | null>(getDeviceRepartoNome())

  const auth = useAuthStore()
  const router = useRouter()

  function clearPasswordState(): void {
    password.value = ''
    temporaryPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  }

  async function loadReparti(): Promise<void> {
    stepError.value = ''
    loading.value = true
    try {
      const { data } = await listReparti()
      reparti.value = data
    } catch {
      stepError.value = 'Impossibile caricare i reparti.'
    } finally {
      loading.value = false
    }
  }

  // Devices configured before the reparto name was persisted only have the id:
  // resolve the name once and write it back.
  async function resolveSavedRepartoNome(
    repartoId: number,
  ): Promise<'ok' | 'missing' | 'failed'> {
    try {
      const { data } = await listReparti()
      reparti.value = data
      const saved = data.find((reparto) => reparto.id === repartoId)
      if (!saved) return 'missing'

      setDeviceReparto(saved)
      repartoNome.value = saved.nome
      return 'ok'
    } catch {
      return 'failed'
    }
  }

  async function loadTilesForDevice(): Promise<void> {
    const repartoId = getDeviceRepartoId()
    if (!repartoId) {
      step.value = 'reparto'
      await loadReparti()
      await focusFirstOf('reparto')
      return
    }

    if (repartoNome.value === null) {
      const outcome = await resolveSavedRepartoNome(repartoId)
      if (outcome === 'missing') {
        // Reparto deleted backend-side: this device has to pick a new one.
        clearDeviceReparto()
        repartoNome.value = null
        step.value = 'reparto'
        await focusFirstOf('reparto')
        return
      }
      // On 'failed' keep going: the badge is cosmetic, login must still work.
    }

    stepError.value = ''
    loading.value = true
    try {
      const { data } = await listUtentiByReparto(repartoId)
      utenti.value = data
      step.value = 'tiles'
      await focusFirstOf('tile')
    } catch {
      stepError.value = 'Impossibile caricare il personale del reparto.'
    } finally {
      loading.value = false
    }
  }

  async function chooseReparto(reparto: Reparto): Promise<void> {
    setDeviceReparto(reparto)
    repartoNome.value = reparto.nome
    await loadTilesForDevice()
  }

  function cambiaReparto(): void {
    clearDeviceReparto()
    repartoNome.value = null
    utenti.value = []
    selectedUtente.value = null
    turnoOggi.value = null
    clearPasswordState()
    error.value = ''
    success.value = ''
    step.value = 'reparto'
    void loadReparti().then(() => focusFirstOf('reparto'))
  }

  async function selectUtente(utente: UtenteTile): Promise<void> {
    selectedUtente.value = utente
    clearPasswordState()
    error.value = ''
    success.value = ''
    step.value = 'password'
    turnoOggi.value = null

    const repartoId = getDeviceRepartoId()
    if (repartoId) {
      try {
        const { data } = await getTurnoOggiUtente(repartoId, utente.id)
        turnoOggi.value = data?.tipo ?? null
      } catch {
        turnoOggi.value = null
      }
    }

    await focusFirstOf('password')
  }

  function tornaAiTile(): void {
    step.value = 'tiles'
    selectedUtente.value = null
    turnoOggi.value = null
    clearPasswordState()
    error.value = ''
    success.value = ''
    void focusFirstOf('tile')
  }

  async function onSubmit(): Promise<void> {
    if (!selectedUtente.value) return

    error.value = ''
    success.value = ''
    loading.value = true
    try {
      await auth.login(selectedUtente.value.id, password.value)
      await router.push({ name: `${auth.ruolo}-dashboard` })
    } catch (err: unknown) {
      const response = getLoginErrorResponse(err)
      if (
        response?.status === 403 &&
        response.data?.detail === 'password_change_required'
      ) {
        temporaryPassword.value = password.value
        password.value = ''
        newPassword.value = ''
        confirmPassword.value = ''
        step.value = 'change-password'
      } else if (
        response?.status === 403 &&
        response.data?.detail === 'temporary_password_expired'
      ) {
        password.value = ''
        error.value = TEMPORARY_PASSWORD_EXPIRED_MESSAGE
      } else {
        error.value = 'Credenziali non valide.'
      }
    } finally {
      loading.value = false
    }
  }

  async function onChangeTemporaryPassword(): Promise<void> {
    if (!selectedUtente.value) return

    error.value = ''
    success.value = ''
    if (newPassword.value !== confirmPassword.value) {
      error.value = 'Le password non coincidono.'
      return
    }

    loading.value = true
    try {
      await changeTemporaryPassword({
        utente_id: selectedUtente.value.id,
        temporary_password: temporaryPassword.value,
        new_password: newPassword.value,
      })
      temporaryPassword.value = ''
      newPassword.value = ''
      confirmPassword.value = ''
      step.value = 'password'
      success.value = 'Password aggiornata. Accedi con la nuova password.'
      await focusFirstOf('password')
    } catch (err: unknown) {
      const response = getLoginErrorResponse(err)
      if (
        response?.status === 403 &&
        response.data?.detail === 'temporary_password_expired'
      ) {
        error.value = TEMPORARY_PASSWORD_EXPIRED_MESSAGE
      } else {
        error.value = 'Impossibile aggiornare la password.'
      }
    } finally {
      loading.value = false
    }
  }

  onMounted(async () => {
    const savedReparto = getDeviceRepartoId()
    if (!savedReparto) {
      step.value = 'reparto'
      await loadReparti()
      await focusFirstOf('reparto')
    } else {
      await loadTilesForDevice()
    }
  })

  return {
    step,
    reparti,
    utenti,
    selectedUtente,
    password,
    temporaryPassword,
    newPassword,
    confirmPassword,
    error,
    success,
    loading,
    stepError,
    turnoOggi,
    repartoNome,
    chooseReparto,
    cambiaReparto,
    selectUtente,
    tornaAiTile,
    onSubmit,
    onChangeTemporaryPassword,
  }
}
