import { expect, test } from '@playwright/test'
import {
  assegnaTurno,
  createPaziente,
  createTurno,
  ensureClinicalInfermiere,
  findUtente,
  getSeedRepartoId,
  login,
  SEED_CAPOSALA,
  storageStateForToken,
} from './helpers/api'
import { checkA11y } from './helpers/a11y'

test('infermiere records vital signs, Norton and Conley in the patient chart', async ({
  browser,
  request,
}) => {
  test.setTimeout(60_000)
  const repartoId = await getSeedRepartoId(request)
  const caposala = await findUtente(
    request,
    repartoId,
    SEED_CAPOSALA.nome,
    SEED_CAPOSALA.cognome,
  )
  const caposalaToken = await login(
    request,
    caposala.id,
    SEED_CAPOSALA.password,
  )
  const infermiere = await ensureClinicalInfermiere(
    request,
    caposalaToken,
    repartoId,
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
    nome: 'Elena',
    cognome: 'CartellaE2E',
    eta: 68,
    letto: '9C',
    data_ricovero: oggi,
    diagnosi_ingresso: 'Monitoraggio clinico E2E',
    reparto_id: repartoId,
  })
  const infermiereToken = await login(request, infermiere.id, 'password')
  const context = await browser.newContext({
    storageState: storageStateForToken(infermiereToken),
  })
  const page = await context.newPage()

  await page.goto(`/pazienti/${paziente.id}`)
  await expect(
    page.getByRole('heading', { name: /CartellaE2E Elena/, level: 1 }),
  ).toBeVisible()
  expect(await checkA11y(page)).toEqual([])

  await page.getByRole('button', { name: 'Nuovi parametri' }).click()
  const parametriDialog = page.getByRole('dialog', {
    name: 'Nuovi parametri vitali',
  })
  await parametriDialog.getByLabel('Temperatura').fill('37.2')
  await parametriDialog.getByLabel('FC').fill('88')
  await parametriDialog.getByLabel('PA sistolica').fill('128')
  await parametriDialog.getByLabel('PA diastolica').fill('76')
  await parametriDialog.getByLabel('FR').fill('18')
  await parametriDialog.getByLabel('SpO₂').fill('97')
  await parametriDialog.getByLabel('Scala dolore (NRS)').fill('3')
  await parametriDialog.getByRole('combobox', { name: 'Vigile' }).click()
  await page.getByRole('option', { name: 'Vigile' }).click()
  await parametriDialog
    .getByRole('textbox', { name: 'Note', exact: true })
    .fill('Rilevamento cartella clinica E2E')
  await parametriDialog.getByRole('button', { name: 'Salva' }).click()
  await expect(parametriDialog).toBeHidden()
  await expect(page.getByText('37.2 °C').first()).toBeVisible()
  await expect(
    page.getByRole('cell', { name: 'Rilevamento cartella clinica E2E' }),
  ).toBeVisible()

  await page.getByRole('tab', { name: 'Scale di valutazione' }).click()
  await page.getByRole('button', { name: 'Nuova Norton' }).click()
  const nortonDialog = page.getByRole('dialog', {
    name: 'Nuova valutazione Norton',
  })
  await nortonDialog.getByLabel('Condizioni generali (1-4)').fill('2')
  await nortonDialog.getByLabel('Stato mentale (1-4)').fill('2')
  await nortonDialog.getByLabel('Attività (1-4)').fill('2')
  await nortonDialog.getByLabel('Mobilità (1-4)').fill('2')
  await nortonDialog.getByLabel('Incontinenza (1-4)').fill('2')
  await nortonDialog.getByRole('button', { name: 'Salva' }).click()
  await expect(nortonDialog).toBeHidden()
  const nortonTable = page.locator('table', { hasText: 'Cond. gen.' })
  await expect(
    nortonTable.getByRole('row', { name: new RegExp(oggi) }),
  ).toContainText('10')

  await page.getByRole('button', { name: 'Nuova Conley' }).click()
  const conleyDialog = page.getByRole('dialog', {
    name: 'Nuova valutazione Conley',
  })
  await conleyDialog.getByLabel('Storia cadute').fill('1')
  await conleyDialog.getByLabel('Deficit visivo').fill('1')
  await conleyDialog.getByLabel('Alterazione eliminazione').fill('1')
  await conleyDialog.getByLabel('Agitazione').fill('1')
  await conleyDialog.getByLabel('Deficit vista osservato').fill('1')
  await conleyDialog.getByLabel('Andatura alterata').fill('1')
  await conleyDialog.getByRole('button', { name: 'Salva' }).click()
  await expect(conleyDialog).toBeHidden()
  const conleyTable = page.locator('table', { hasText: 'Vista oss.' })
  await expect(
    conleyTable.getByRole('row', { name: new RegExp(oggi) }),
  ).toBeVisible()
  expect(await checkA11y(page)).toEqual([])

  await context.close()
})
