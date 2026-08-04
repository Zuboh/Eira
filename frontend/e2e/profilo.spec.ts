import { expect, test } from '@playwright/test'
import {
  ensureClinicalInfermiere,
  findUtente,
  getSeedRepartoId,
  login,
  SEED_CAPOSALA,
  storageStateForToken,
} from './helpers/api'
import { checkA11y } from './helpers/a11y'

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
)

test('user uploads and sees a normalized profile avatar', async ({
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
  const token = await login(request, infermiere.id, 'password')
  const context = await browser.newContext({
    storageState: storageStateForToken(token),
  })
  const page = await context.newPage()

  await page.goto('/profilo')
  await expect(
    page.getByRole('heading', { name: 'Il mio profilo', level: 1 }),
  ).toBeVisible()
  expect(await checkA11y(page)).toEqual([])

  const profileAvatar = page
    .getByRole('main')
    .getByAltText('Foto profilo di Sara ConsegnaE2E')
  const previousSrc = await profileAvatar.getAttribute('src')
  await page.locator('#staff-avatar').setInputFiles({
    name: 'avatar-e2e.png',
    mimeType: 'image/png',
    buffer: PNG_1X1,
  })
  await expect(page.getByText(/avatar-e2e\.png/)).toBeVisible()
  await page.getByRole('button', { name: 'Salva foto' }).click()

  await expect(page.getByText('Foto profilo aggiornata.')).toBeVisible()
  await expect(profileAvatar).not.toHaveAttribute('src', previousSrc ?? '')
  await expect(profileAvatar).toHaveAttribute('src', /avatar/)
  expect(await checkA11y(page)).toEqual([])
  await context.close()
})
