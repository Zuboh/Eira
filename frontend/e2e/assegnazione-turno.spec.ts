import { expect, test } from '@playwright/test'
import {
  createTurno,
  findUtente,
  getSeedRepartoId,
  login,
  SEED_CAPOSALA,
  SEED_INFERMIERE,
  storageStateForToken,
} from './helpers/api'
import { checkA11y } from './helpers/a11y'

test('caposala assigns an uncovered turno to an infermiere', async ({
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

  const domani = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
  await createTurno(request, caposalaToken, {
    data: domani,
    tipo: 'notte',
    reparto_id: repartoId,
    ora_inizio: '21:00:00',
    ora_fine: '07:00:00',
  })

  const context = await browser.newContext({
    storageState: storageStateForToken(caposalaToken),
  })
  const page = await context.newPage()
  await page.goto('/caposala')
  await expect(
    page.getByRole('heading', { name: 'Dashboard Caposala' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Turni scoperti' }),
  ).toBeVisible()
  expect(await checkA11y(page)).toEqual([])

  const scopertiCard = page.locator('.eira-card', { hasText: 'Turni scoperti' })
  const scopertiRow = scopertiCard.getByRole('row', { name: /Notte/ })
  await expect(scopertiRow).toBeVisible()
  await scopertiRow.getByRole('button', { name: 'Assegna' }).click()

  await expect(
    page.getByRole('dialog', { name: 'Assegna turno' }),
  ).toBeVisible()
  await page
    .locator('.form-field', { hasText: 'Infermiere' })
    .getByRole('combobox')
    .click()
  await page.getByRole('option', { name: infermiere.cognome }).click()
  await page
    .getByRole('dialog', { name: 'Assegna turno' })
    .getByRole('button', { name: 'Assegna', exact: true })
    .click()

  await expect(page.getByRole('dialog', { name: 'Assegna turno' })).toBeHidden()
  await expect(scopertiCard.getByRole('row', { name: /Notte/ })).toHaveCount(0)
  expect(await checkA11y(page)).toEqual([])

  await context.close()
})
