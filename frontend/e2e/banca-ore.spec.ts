import { expect, test } from '@playwright/test'
import {
  findUtente,
  getSeedRepartoId,
  login,
  SEED_CAPOSALA,
  SEED_INFERMIERE,
  storageStateForToken,
} from './helpers/api'
import { checkA11y } from './helpers/a11y'

async function expectLedger(page: import('@playwright/test').Page) {
  await expect(page.getByText('Ore effettuate', { exact: true })).toBeVisible()
  await expect(
    page.getByText('Ore contrattuali', { exact: true }),
  ).toBeVisible()
  await expect(page.getByText('Saldo', { exact: true })).toBeVisible()
}

test('banca ore is visible to infermiere and selectable by caposala', async ({
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
  const [caposalaToken, infermiereToken] = await Promise.all([
    login(request, caposala.id, SEED_CAPOSALA.password),
    login(request, infermiere.id, SEED_INFERMIERE.password),
  ])

  const infermiereContext = await browser.newContext({
    storageState: storageStateForToken(infermiereToken),
  })
  const infermierePage = await infermiereContext.newPage()
  await infermierePage.goto('/infermiere')
  await expect(
    infermierePage.getByRole('heading', { name: 'Dashboard', level: 1 }),
  ).toBeVisible()
  await expectLedger(infermierePage)
  await infermiereContext.close()

  const caposalaContext = await browser.newContext({
    storageState: storageStateForToken(caposalaToken),
  })
  const caposalaPage = await caposalaContext.newPage()
  await caposalaPage.goto('/banca-ore')
  await expect(
    caposalaPage.getByRole('heading', { name: 'Banca Ore', level: 1 }),
  ).toBeVisible()
  await expect(
    caposalaPage.getByRole('combobox', {
      name: SEED_INFERMIERE.cognome,
    }),
  ).toBeVisible()
  await expectLedger(caposalaPage)
  expect(await checkA11y(caposalaPage)).toEqual([])
  await caposalaContext.close()
})
