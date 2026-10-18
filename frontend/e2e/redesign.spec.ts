import { expect, test } from '@playwright/test'
import {
  findUtente,
  getSeedRepartoId,
  login,
  SEED_CAPOSALA,
  storageStateForToken,
} from './helpers/api'
import { checkA11y } from './helpers/a11y'

test('mobile tables confine scrolling and distinguish a failed load from an empty list', async ({
  browser,
  request,
}) => {
  test.setTimeout(60_000)
  const repartoId = await getSeedRepartoId(request)
  const user = await findUtente(
    request,
    repartoId,
    SEED_CAPOSALA.nome,
    SEED_CAPOSALA.cognome,
  )
  const token = await login(request, user.id, SEED_CAPOSALA.password)
  const context = await browser.newContext({
    storageState: storageStateForToken(token),
    viewport: { width: 320, height: 900 },
  })
  const page = await context.newPage()
  await page.route('**/api/v1/pazienti/*', (route) =>
    route.fulfill({
      json: [
        {
          id: 999,
          nome: 'NomeMoltoLungoSenzaSpazi'.repeat(4),
          cognome: 'Paziente con cognome composto',
          eta: 87,
          letto: '12A',
          data_ricovero: '2026-10-15',
          diagnosi_ingresso: 'Diagnosi estesa '.repeat(20),
          reparto_id: repartoId,
          dimesso: false,
        },
      ],
    }),
  )
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme })
    await page.goto('/pazienti')
    await expect(
      page.getByRole('region', { name: 'Pazienti del reparto' }),
    ).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    expect(await checkA11y(page)).toEqual([])
    const link = page.getByRole('link', {
      name: /Paziente con cognome composto/,
    })
    await link.focus()
    await expect(link).toBeFocused()
    expect(
      await link.evaluate((el) => getComputedStyle(el).outlineStyle),
    ).not.toBe('none')
  }
  await page.unroute('**/api/v1/pazienti/*')
  await page.route('**/api/v1/pazienti/*', (route) =>
    route.fulfill({ status: 500, json: { detail: 'Test load failure' } }),
  )
  await page.reload()
  await expect(page.getByRole('alert')).toHaveText(
    'Impossibile caricare i pazienti.',
  )
  await expect(page.getByText('Nessun paziente in reparto')).toHaveCount(0)
  await page.unroute('**/api/v1/pazienti/*')
  await page.route('**/api/v1/pazienti/*', (route) =>
    route.fulfill({ json: [] }),
  )
  await page.getByRole('button', { name: 'Riprova' }).click()
  await expect(page.getByText('Nessun paziente in reparto')).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
  const open = page.getByRole('button', { name: 'Nuovo paziente', exact: true })
  await open.click()
  const dialog = page.getByRole('dialog', { name: 'Nuovo paziente' })
  await dialog
    .getByLabel('Nome', { exact: false })
    .first()
    .fill('Nome lungo di verifica')
  await dialog.getByLabel('Cognome', { exact: false }).fill('Redesign')
  await dialog.getByRole('spinbutton', { name: 'Età' }).fill('70')
  await dialog.getByLabel('Letto').fill('12A')
  await dialog
    .getByLabel('Diagnosi ingresso')
    .fill('Verifica errore senza perdere i dati')
  await expect(dialog.getByRole('spinbutton', { name: 'Età' })).toHaveAttribute(
    'aria-required',
    'true',
  )
  await expect(
    dialog.getByRole('combobox', { name: 'Data ricovero' }),
  ).toHaveAttribute('aria-required', 'true')
  expect(await checkA11y(page)).toEqual([])
  await page.unroute('**/api/v1/pazienti/*')
  let finishRequest!: () => void
  const pending = new Promise<void>((resolve) => {
    finishRequest = resolve
  })
  await page.route('**/api/v1/pazienti/*', async (route) => {
    await pending
    await route.fulfill({ status: 500, json: { detail: 'Test save failure' } })
  })
  const save = dialog.getByRole('button', { name: 'Crea', exact: true })
  const before = await save.boundingBox()
  await save.click()
  await expect(save).toBeDisabled()
  const during = await save.boundingBox()
  expect(during?.width).toBe(before?.width)
  finishRequest()
  await expect(dialog.getByRole('alert')).toHaveText(
    'Impossibile creare il paziente.',
  )
  await expect(dialog.getByLabel('Diagnosi ingresso')).toHaveValue(
    'Verifica errore senza perdere i dati',
  )
  await expect(save).toBeEnabled()
  await page.keyboard.press('Escape')
  await expect(open).toBeFocused()
  await context.close()
})
