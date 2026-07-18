import { expect, test } from '@playwright/test'
import {
  assegnaTurno,
  createTurno,
  createUtente,
  findUtente,
  getSeedRepartoId,
  login,
  SEED_CAPOSALA,
  SEED_INFERMIERE,
  storageStateForToken,
} from './helpers/api'
import { checkA11y } from './helpers/a11y'

test('cambio turno round-trip: richiedente -> collega accetta -> caposala approva', async ({
  browser,
  request,
}) => {
  const repartoId = await getSeedRepartoId(request)
  const caposala = await findUtente(
    request,
    repartoId,
    SEED_CAPOSALA.nome,
    SEED_CAPOSALA.cognome,
  )
  const richiedente = await findUtente(
    request,
    repartoId,
    SEED_INFERMIERE.nome,
    SEED_INFERMIERE.cognome,
  )
  const caposalaToken = await login(
    request,
    caposala.id,
    SEED_CAPOSALA.password,
  )

  const collega = await createUtente(request, caposalaToken, repartoId, {
    nome: 'Marco',
    cognome: 'CambioTurnoCollega',
    email: 'collega.cambio.turno@eira.local',
    ruolo: 'infermiere',
    password: 'password',
  })

  const oggi = new Date().toISOString().slice(0, 10)
  const turno = await createTurno(request, caposalaToken, {
    data: oggi,
    tipo: 'pomeriggio',
    reparto_id: repartoId,
    ora_inizio: '14:00:00',
    ora_fine: '21:00:00',
  })
  await assegnaTurno(request, caposalaToken, turno.id, richiedente.id)

  // Richiedente: creates the swap request through the real UI.
  const richiedenteToken = await login(
    request,
    richiedente.id,
    SEED_INFERMIERE.password,
  )
  const richiedenteCtx = await browser.newContext({
    storageState: storageStateForToken(richiedenteToken),
  })
  const richiedentePage = await richiedenteCtx.newPage()
  await richiedentePage.goto('/cambio-turno')
  await expect(
    richiedentePage.getByRole('heading', { name: 'Cambio Turno' }),
  ).toBeVisible()
  expect(await checkA11y(richiedentePage)).toEqual([])

  await richiedentePage.getByRole('button', { name: 'Richiedi cambio' }).click()
  await richiedentePage
    .locator('.form-field', { hasText: 'Tuo turno' })
    .getByRole('combobox')
    .click()
  await richiedentePage.getByRole('option', { name: String(turno.id) }).click()
  await richiedentePage
    .locator('.form-field', { hasText: 'Collega' })
    .getByRole('combobox')
    .click()
  await richiedentePage.getByRole('option', { name: collega.cognome }).click()
  await richiedentePage.getByRole('button', { name: 'Invia richiesta' }).click()

  await expect(
    richiedentePage.getByRole('row', { name: new RegExp(collega.cognome) }),
  ).toBeVisible()
  await richiedenteCtx.close()

  // Collega: accepts the swap.
  const collegaToken = await login(request, collega.id, 'password')
  const collegaCtx = await browser.newContext({
    storageState: storageStateForToken(collegaToken),
  })
  const collegaPage = await collegaCtx.newPage()
  await collegaPage.goto('/cambio-turno')
  await collegaPage
    .getByRole('row', { name: new RegExp(collega.cognome) })
    .getByRole('button', { name: 'Accetta' })
    .click()
  await expect(
    collegaPage.getByRole('row', { name: new RegExp(collega.cognome) }),
  ).toContainText('in_attesa_caposala')
  await collegaCtx.close()

  // Caposala: approves — the swap is complete.
  const caposalaCtx = await browser.newContext({
    storageState: storageStateForToken(caposalaToken),
  })
  const caposalaPage = await caposalaCtx.newPage()
  await caposalaPage.goto('/cambio-turno')
  await caposalaPage
    .getByRole('row', { name: new RegExp(collega.cognome) })
    .getByRole('button', { name: 'Approva' })
    .click()
  await expect(
    caposalaPage.getByRole('row', { name: new RegExp(collega.cognome) }),
  ).toContainText('approvata', { ignoreCase: true })
  expect(await checkA11y(caposalaPage)).toEqual([])
  await caposalaCtx.close()
})
