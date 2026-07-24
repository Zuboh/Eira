import { expect, test } from '@playwright/test'
import {
  findUtente,
  getSeedRepartoId,
  login,
  SEED_INFERMIERE,
  storageStateForToken,
} from './helpers/api'
import { checkA11y } from './helpers/a11y'

test('infermiere adjusts farmaco quantity and sees movement history', async ({
  browser,
  request,
}) => {
  const repartoId = await getSeedRepartoId(request)
  const infermiere = await findUtente(
    request,
    repartoId,
    SEED_INFERMIERE.nome,
    SEED_INFERMIERE.cognome,
  )
  const token = await login(request, infermiere.id, SEED_INFERMIERE.password)

  const context = await browser.newContext({
    storageState: storageStateForToken(token),
  })
  const page = await context.newPage()

  await page.goto('/carello-farmaci')
  await expect(
    page.getByRole('heading', { name: 'Carello Farmaci' }),
  ).toBeVisible()
  expect(await checkA11y(page)).toEqual([])

  const firstRow = page
    .getByRole('row')
    .filter({ has: page.getByRole('button', { name: 'Aumenta quantità' }) })
    .first()
  await expect(firstRow).toBeVisible()
  const farmacoName = (await firstRow.locator('td').first().textContent())
    ?.trim()
    .split('\n')[0]
  await firstRow.getByRole('button', { name: 'Aumenta quantità' }).click()

  await page.getByRole('button', { name: 'Storico movimenti' }).click()
  if (farmacoName) {
    await expect(
      page.getByRole('row', { name: new RegExp(farmacoName) }).first(),
    ).toBeVisible()
  }
  expect(await checkA11y(page)).toEqual([])
})
