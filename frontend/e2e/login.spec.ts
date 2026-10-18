import { expect, test } from '@playwright/test'
import { SEED_CAPOSALA, SEED_REPARTO_NOME } from './helpers/api'
import { checkA11y } from './helpers/a11y'

test('protected routes redirect an anonymous user to login', async ({
  page,
}) => {
  await page.goto('/caposala')

  await expect(page).toHaveURL(/\/login$/)
  await expect(
    page.getByRole('heading', { name: 'Eira', level: 1 }),
  ).toBeVisible()
})

test('caposala logs in through the device reparto/tile flow and lands on the dashboard', async ({
  page,
}) => {
  await page.goto('/login')

  await expect(
    page.getByRole('heading', { name: 'Eira', level: 1 }),
  ).toBeVisible()
  expect(await checkA11y(page)).toEqual([])

  await page.getByRole('button', { name: SEED_REPARTO_NOME }).click()
  await page
    .getByRole('button', {
      name: `${SEED_CAPOSALA.nome} ${SEED_CAPOSALA.cognome}`,
    })
    .click()
  expect(await checkA11y(page)).toEqual([])
  const password = page.getByLabel('Password', { exact: true })
  await password.fill(SEED_CAPOSALA.password)
  await page.getByRole('button', { name: 'Mostra password' }).focus()
  await page.keyboard.press('Enter')
  await expect(password).toHaveAttribute('type', 'text')
  await page.getByRole('button', { name: 'Nascondi password' }).click()
  await expect(password).toHaveAttribute('type', 'password')
  await page.getByRole('button', { name: 'Accedi' }).click()

  await expect(
    page.getByRole('heading', { name: 'Dashboard Caposala' }),
  ).toBeVisible()

  expect(await checkA11y(page)).toEqual([])
})
