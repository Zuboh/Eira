/**
 * Errori HTTP degli endpoint FastAPI, con il `detail` del backend conservato.
 *
 * I router mandano gia' messaggi in italiano e pensati per l'utente
 * ("Non sei assegnata a questo turno"): buttarli via e mostrare una stringa
 * fissa lascia chi compila il form senza sapere cosa correggere.
 */

type OpenApiResult<TData> = {
  data?: TData
  error?: unknown
  response: Response
}

type ValidationErrorItem = {
  loc?: unknown
  msg?: unknown
}

export class ApiError extends Error {
  readonly operation: string
  readonly status: number
  /** Messaggio del backend, `null` se la risposta non ne aveva uno usabile. */
  readonly detail: string | null

  constructor(
    operation: string,
    status: number,
    detail: string | null,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
    this.operation = operation
    this.status = status
    this.detail = detail
  }
}

function fieldNameFromLoc(loc: unknown): string | null {
  if (!Array.isArray(loc) || loc.length === 0) return null
  const last = loc[loc.length - 1]
  return typeof last === 'string' ? last : null
}

/**
 * Estrae il messaggio mostrabile dal corpo d'errore FastAPI.
 *
 * `HTTPException` risponde `{ detail: "..." }`; la validazione pydantic
 * risponde `{ detail: [{ loc, msg }, ...] }` con `msg` in inglese, quindi in
 * quel caso si riassumono solo i campi coinvolti.
 */
export function extractDetail(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) return null

  const detail = (error as { detail?: unknown }).detail

  if (typeof detail === 'string') {
    return detail.trim() || null
  }

  if (Array.isArray(detail)) {
    const campi = [
      ...new Set(
        detail
          .map((item) => fieldNameFromLoc((item as ValidationErrorItem)?.loc))
          .filter((campo): campo is string => campo !== null),
      ),
    ]
    if (campi.length === 0) return null
    return `Alcuni campi non sono validi: ${campi.join(', ')}.`
  }

  return null
}

function formatOpenApiError(error: unknown, response: Response) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (error === undefined) {
    return `Request failed with status ${response.status}`
  }

  try {
    return JSON.stringify(error)
  } catch {
    return `Request failed with status ${response.status}`
  }
}

export function unwrapData<TData>(
  result: OpenApiResult<TData>,
  operation: string,
): { data: TData } {
  if (result.error !== undefined) {
    throw new ApiError(
      operation,
      result.response.status,
      extractDetail(result.error),
      `${operation} failed: ${formatOpenApiError(result.error, result.response)}`,
    )
  }

  if (result.data === undefined) {
    throw new Error(`${operation} failed: response data is undefined`)
  }

  return { data: result.data }
}

/** Messaggio da mostrare all'utente: `detail` del backend, altrimenti `fallback`. */
export function apiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.detail) {
    return err.detail
  }

  return fallback
}
