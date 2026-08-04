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

test('infermiere requests summer leave and caposala approves it', async ({
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
  await infermierePage.goto('/ferie')
  await expect(
    infermierePage.getByRole('heading', { name: 'Ferie', level: 1 }),
  ).toBeVisible()
  expect(await checkA11y(infermierePage)).toEqual([])

  await infermierePage
    .getByRole('combobox', { name: 'Seleziona un blocco di 2 settimane' })
    .click()
  const primaPreferenza = infermierePage.getByRole('option').first()
  const preferenzaLabel = await primaPreferenza.textContent()
  await primaPreferenza.click()
  await infermierePage
    .getByRole('button', { name: 'Richiedi ferie estive' })
    .click()

  const richiestaInfermiere = infermierePage.getByRole('row', {
    name: new RegExp(SEED_INFERMIERE.nome, 'i'),
  })
  await expect(richiestaInfermiere).toContainText(/in attesa/i)
  if (preferenzaLabel) {
    await expect(richiestaInfermiere).toContainText(
      preferenzaLabel.split('→')[0].trim(),
    )
  }
  await infermiereContext.close()

  const caposalaContext = await browser.newContext({
    storageState: storageStateForToken(caposalaToken),
  })
  const caposalaPage = await caposalaContext.newPage()
  await caposalaPage.goto('/ferie')
  const richiestaCaposala = caposalaPage.getByRole('row', {
    name: new RegExp(SEED_INFERMIERE.nome, 'i'),
  })
  await richiestaCaposala.getByRole('button', { name: 'Approva' }).click()
  const approvaDialog = caposalaPage.getByRole('dialog', {
    name: 'Approva richiesta ferie',
  })
  await expect(approvaDialog).toBeVisible()
  await approvaDialog
    .getByRole('button', { name: 'Conferma approvazione' })
    .click()

  await expect(approvaDialog).toBeHidden()
  await expect(richiestaCaposala).toContainText(/approvata/i)
  expect(await checkA11y(caposalaPage)).toEqual([])
  await caposalaContext.close()
})
