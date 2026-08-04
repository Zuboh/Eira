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
    nome: 'Mario',
    cognome: 'ConsegnaTestRossi',
    eta: 72,
    letto: '4A',
    data_ricovero: oggi,
    diagnosi_ingresso: 'Osservazione',
    reparto_id: repartoId,
  })

  const infermiereToken = await login(request, infermiere.id, 'password')
  const context = await browser.newContext({
    storageState: storageStateForToken(infermiereToken),
  })
  const page = await context.newPage()

  await page.goto('/consegne-sbar')
  await expect(
    page.getByRole('heading', { name: 'Diario Clinico' }),
  ).toBeVisible()
  expect(await checkA11y(page)).toEqual([])

  await page.getByRole('button', { name: 'Nuova consegna' }).click()
  await expect(
    page.getByRole('dialog', { name: 'Nuova consegna' }),
  ).toBeVisible()

  await page.getByLabel('Paziente').click()
  await page.getByRole('option', { name: paziente.cognome }).click()

  await expect(page.getByText(/Turno rilevato:.*Mattina/)).toBeVisible()

  // Il dialog apre gia' con lo scaffold `S:\nB:\nA:\nR:`; la sigla a inizio
  // riga e' il marker di sezione.
  const testo = page.getByLabel('Testo consegna')
  await expect(testo).toHaveValue('S:\nB:\nA:\nR:')
  await testo.fill(
    [
      'S: Paziente stabile, parametri nella norma.',
      'B: Ricovero per osservazione post-caduta.',
      'A: Nessuna criticità rilevata al turno.',
      'R: Proseguire monitoraggio standard.',
    ].join('\n'),
  )
  await expect(
    page.getByText('Nessuna criticità rilevata al turno.'),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Salva consegna' }).click()

  await expect(
    page.getByRole('dialog', { name: 'Nuova consegna' }),
  ).toBeHidden()
  await expect(page.getByText(paziente.cognome)).toBeVisible()
  expect(await checkA11y(page)).toEqual([])

  // Round-trip: la modifica riapre lo stesso dialog, precompilato in sigle.
  await page.getByRole('button', { name: 'Modifica' }).first().click()
  const editDialog = page.getByRole('dialog', { name: 'Modifica consegna' })
  await expect(editDialog).toBeVisible()

  const testoEdit = page.getByLabel('Testo consegna')
  await expect(testoEdit).toHaveValue(
    [
      'S: Paziente stabile, parametri nella norma.',
      'B: Ricovero per osservazione post-caduta.',
      'A: Nessuna criticità rilevata al turno.',
      'R: Proseguire monitoraggio standard.',
    ].join('\n'),
  )

  await testoEdit.fill(
    [
      'S: Paziente vigile, richiede analgesia al bisogno.',
      'B: Ricovero per osservazione post-caduta.',
      'A: Nessuna criticità rilevata al turno.',
      'R: Proseguire monitoraggio standard.',
    ].join('\n'),
  )
  await page.getByRole('button', { name: 'Salva modifiche' }).click()

  await expect(editDialog).toBeHidden()
  await expect(
    page.getByText('Paziente vigile, richiede analgesia al bisogno.'),
  ).toBeVisible()
  expect(await checkA11y(page)).toEqual([])

  await context.close()
})
