import { expect, test } from '@playwright/test'
import {
  assegnaTurno,
  createPaziente,
  createTurno,
  findUtente,
  getSeedRepartoId,
  login,
  SEED_CAPOSALA,
  SEED_INFERMIERE,
  storageStateForToken,
} from './helpers/api'
import { checkA11y } from './helpers/a11y'

// FormField doesn't wire `for-id` on its Select/Textarea children (same
// missing-label class as the PasswordStep bug fixed alongside login.spec.ts,
// but widespread across dialogs) — tracked in docs/VALUTAZIONE-TESI.md.
// getByLabel won't resolve here, so these locators scope by the FormField
// wrapper's visible label text instead.
function field(page: import('@playwright/test').Page, label: string) {
  return page.locator('.form-field', { hasText: label })
}

test('infermiere creates a SBAR handoff for a patient on their assigned turno', async ({
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
  const infermiere = await findUtente(
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

  const oggi = new Date().toISOString().slice(0, 10)
  const turno = await createTurno(request, caposalaToken, {
    data: oggi,
    tipo: 'mattina',
    reparto_id: repartoId,
    ora_inizio: '07:00:00',
    ora_fine: '14:00:00',
  })
  await assegnaTurno(request, caposalaToken, turno.id, infermiere.id)
  const paziente = await createPaziente(request, caposalaToken, {
    nome: 'Mario',
    cognome: 'ConsegnaTestRossi',
    eta: 72,
    letto: '4A',
    data_ricovero: oggi,
    diagnosi_ingresso: 'Osservazione',
    reparto_id: repartoId,
  })

  const infermiereToken = await login(
    request,
    infermiere.id,
    SEED_INFERMIERE.password,
  )
  const context = await browser.newContext({
    storageState: storageStateForToken(infermiereToken),
  })
  const page = await context.newPage()

  await page.goto('/consegne-sbar')
  await expect(
    page.getByRole('heading', { name: 'Consegne SBAR' }),
  ).toBeVisible()
  expect(await checkA11y(page)).toEqual([])

  await page.getByRole('button', { name: 'Nuova consegna' }).click()
  await expect(
    page.getByRole('dialog', { name: 'Nuova consegna' }),
  ).toBeVisible()

  await field(page, 'Paziente').getByRole('combobox').click()
  await page.getByRole('option', { name: paziente.cognome }).click()

  await field(page, 'Turno').getByRole('combobox').click()
  await page.getByRole('option', { name: String(turno.id) }).click()

  await field(page, 'Situation')
    .locator('textarea')
    .fill('Paziente stabile, parametri nella norma.')
  await field(page, 'Background')
    .locator('textarea')
    .fill('Ricovero per osservazione post-caduta.')
  await field(page, 'Assessment')
    .locator('textarea')
    .fill('Nessuna criticità rilevata al turno.')
  await field(page, 'Recommendation')
    .locator('textarea')
    .fill('Proseguire monitoraggio standard.')

  await page.getByRole('button', { name: 'Salva' }).click()

  await expect(
    page.getByRole('dialog', { name: 'Nuova consegna' }),
  ).toBeHidden()
  await expect(page.getByText(paziente.cognome)).toBeVisible()
  expect(await checkA11y(page)).toEqual([])

  await context.close()
})
