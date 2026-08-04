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
  const farmacoName = (await firstRow.locator('strong').textContent())?.trim()
  await firstRow.getByRole('button', { name: 'Aumenta quantità' }).click()

  const storicoTab = page.getByRole('tab', { name: 'Storico movimenti' })
  await storicoTab.focus()
  await storicoTab.press('ArrowLeft')
  await expect(page.getByRole('tab', { name: 'Stock' })).toBeFocused()
  await page.getByRole('tab', { name: 'Stock' }).press('End')
  await expect(storicoTab).toBeFocused()
  await expect(storicoTab).toHaveAttribute('aria-selected', 'true')
  await expect(
    page.getByRole('tabpanel', { name: 'Storico movimenti' }),
  ).toBeVisible()
  if (farmacoName) {
    await expect(
      page.getByRole('row', { name: new RegExp(farmacoName) }).first(),
    ).toBeVisible()
  }
  expect(await checkA11y(page)).toEqual([])
})
