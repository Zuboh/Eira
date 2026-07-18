import type { APIRequestContext } from '@playwright/test'

export const API_BASE = 'http://localhost:8001/api/v1'

// Matches backend/app/core/config.py defaults — fresh e2e.db seeds these on
// every backend startup (idempotent _seed_dev_data), see backend/app/main.py.
export const SEED_REPARTO_NOME = 'Medicina Generale e Geriatria'
export const SEED_CAPOSALA = {
  nome: 'Admin',
  cognome: 'Caposala',
  password: 'password',
}
export const SEED_INFERMIERE = {
  nome: 'Giulia',
  cognome: 'Bianchi',
  password: 'password',
}

export type SeedUser = { id: number; nome: string; cognome: string }

export async function getSeedRepartoId(
  request: APIRequestContext,
): Promise<number> {
  const res = await request.get(`${API_BASE}/reparti/`)
  const reparti = (await res.json()) as { id: number; nome: string }[]
  const reparto = reparti.find((r) => r.nome === SEED_REPARTO_NOME)
  if (!reparto) throw new Error(`Seed reparto "${SEED_REPARTO_NOME}" not found`)
  return reparto.id
}

export async function findUtente(
  request: APIRequestContext,
  repartoId: number,
  nome: string,
  cognome: string,
): Promise<SeedUser> {
  const res = await request.get(`${API_BASE}/reparti/${repartoId}/utenti`)
  const utenti = (await res.json()) as SeedUser[]
  const utente = utenti.find((u) => u.nome === nome && u.cognome === cognome)
  if (!utente)
    throw new Error(
      `Utente "${nome} ${cognome}" not found in reparto ${repartoId}`,
    )
  return utente
}

// /auth/token is rate-limited to 5/minute keyed by IP (backend/app/routers/auth.py)
// — a deliberate anti-bruteforce control, not something to relax for tests. All
// specs run in one process (playwright.config.ts workers: 1), so caching tokens
// by utente id here means each seed user is only ever actually logged in once
// per suite run, no matter how many spec files reference them.
const tokenCache = new Map<number, string>()

export async function login(
  request: APIRequestContext,
  utenteId: number,
  password: string,
): Promise<string> {
  const cached = tokenCache.get(utenteId)
  if (cached) return cached

  const res = await request.post(`${API_BASE}/auth/token`, {
    form: { username: String(utenteId), password, scope: '' },
  })
  if (!res.ok()) {
    throw new Error(
      `login failed for utente ${utenteId}: ${res.status()} ${await res.text()}`,
    )
  }
  const { access_token } = (await res.json()) as { access_token: string }
  tokenCache.set(utenteId, access_token)
  return access_token
}

export function storageStateForToken(token: string) {
  return {
    cookies: [],
    origins: [
      {
        origin: 'http://localhost:5174',
        localStorage: [{ name: 'eira_token', value: token }],
      },
    ],
  }
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` }
}

export async function createUtente(
  request: APIRequestContext,
  caposalaToken: string,
  repartoId: number,
  payload: {
    nome: string
    cognome: string
    email: string
    ruolo: 'infermiere' | 'caposala'
    password: string
  },
): Promise<SeedUser> {
  // reparto_id is required by the request schema but ignored server-side
  // (backend/app/routers/utenti.py forces current_user.reparto_id) — passed
  // through anyway for a valid, self-consistent payload.
  const res = await request.post(`${API_BASE}/utenti/`, {
    headers: authHeaders(caposalaToken),
    data: { ...payload, reparto_id: repartoId },
  })
  if (!res.ok())
    throw new Error(`createUtente failed: ${res.status()} ${await res.text()}`)
  return res.json()
}

export async function createTurno(
  request: APIRequestContext,
  caposalaToken: string,
  payload: {
    data: string
    tipo: 'mattina' | 'pomeriggio' | 'notte'
    reparto_id: number
    ora_inizio: string
    ora_fine: string
  },
): Promise<{ id: number }> {
  const res = await request.post(`${API_BASE}/turni/`, {
    headers: authHeaders(caposalaToken),
    data: payload,
  })
  if (!res.ok())
    throw new Error(`createTurno failed: ${res.status()} ${await res.text()}`)
  return res.json()
}

export async function assegnaTurno(
  request: APIRequestContext,
  caposalaToken: string,
  turnoId: number,
  infermiereId: number,
): Promise<{ id: number }> {
  const res = await request.post(`${API_BASE}/turni/${turnoId}/assegnazioni`, {
    headers: authHeaders(caposalaToken),
    data: { infermiere_id: infermiereId },
  })
  if (!res.ok())
    throw new Error(`assegnaTurno failed: ${res.status()} ${await res.text()}`)
  return res.json()
}

export async function createPaziente(
  request: APIRequestContext,
  caposalaToken: string,
  payload: {
    nome: string
    cognome: string
    eta: number
    letto: string
    data_ricovero: string
    diagnosi_ingresso: string
    reparto_id: number
  },
): Promise<{ id: number; nome: string; cognome: string }> {
  const res = await request.post(`${API_BASE}/pazienti/`, {
    headers: authHeaders(caposalaToken),
    data: payload,
  })
  if (!res.ok())
    throw new Error(
      `createPaziente failed: ${res.status()} ${await res.text()}`,
    )
  return res.json()
}

export async function createRichiestaCambioTurno(
  request: APIRequestContext,
  richiedenteToken: string,
  assegnazioneTurnoId: number,
  collegaId: number,
): Promise<{ id: number }> {
  const res = await request.post(`${API_BASE}/cambi-turno/`, {
    headers: authHeaders(richiedenteToken),
    data: { assegnazione_turno_id: assegnazioneTurnoId, collega_id: collegaId },
  })
  if (!res.ok()) {
    throw new Error(
      `createRichiestaCambioTurno failed: ${res.status()} ${await res.text()}`,
    )
  }
  return res.json()
}
