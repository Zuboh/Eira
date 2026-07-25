import { expect, test } from '@playwright/test'
import {
  assegnaTurno,
  createPaziente,
  createTurno,
  findUtente,
  getSeedRepartoId,
  login,
  SEED_CAPOSALA,
  SEED_INFERMIERE,
  storageStateForToken,
} from './helpers/api'
import { checkA11y } from './helpers/a11y'

// FormField doesn't wire `for-id` on its Select/Textarea children (same
// missing-label class as the PasswordStep bug fixed alongside login.spec.ts,
// but widespread across dialogs) — tracked in docs/VALUTAZIONE-TESI.md.
// getByLabel won't resolve here, so these locators scope by the FormField
// wrapper's visible label text instead.
function field(page: import('@playwright/test').Page, label: string) {
  return page.locator('.form-field', { hasText: label })
}

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

  const infermiereToken = await login(
    request,
    infermiere.id,
    SEED_INFERMIERE.password,
  )
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

  await field(page, 'Paziente').getByRole('combobox').click()
  await page.getByRole('option', { name: paziente.cognome }).click()

  await expect(
    field(page, 'Data turno').getByText(/Turno rilevato:.*Mattina/),
  ).toBeVisible()

  // Il dialog apre gia' con lo scaffold `S:\nB:\nA:\nR:`; la sigla a inizio
  // riga e' il marker di sezione.
  const testo = field(page, 'Testo consegna').locator('textarea')
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

  const testoEdit = field(page, 'Testo consegna').locator('textarea')
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
