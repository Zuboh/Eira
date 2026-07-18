import { expect, test } from '@playwright/test'
import { SEED_CAPOSALA, SEED_REPARTO_NOME } from './helpers/api'
import { checkA11y } from './helpers/a11y'

test('caposala logs in through the device reparto/tile flow and lands on the dashboard', async ({
  page,
}) => {
  await page.goto('/login')

  await expect(page.getByRole('heading', { name: 'Eira' })).toBeVisible()
  expect(await checkA11y(page)).toEqual([])

  await page.getByRole('button', { name: SEED_REPARTO_NOME }).click()
  await page
    .getByRole('button', {
      name: `${SEED_CAPOSALA.nome} ${SEED_CAPOSALA.cognome}`,
    })
    .click()
  await page.getByLabel('Password').fill(SEED_CAPOSALA.password)
  await page.getByRole('button', { name: 'Accedi' }).click()

  await expect(
    page.getByRole('heading', { name: 'Dashboard Caposala' }),
  ).toBeVisible()

  expect(await checkA11y(page)).toEqual([])
})
