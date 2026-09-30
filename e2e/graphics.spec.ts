import { test, expect } from '@playwright/test'
import { api, open, shot, state } from './helpers'

test.use({ viewport: { width: 1024, height: 576 } })

test('décors : achat, équipement, planche/mur/ambiance/objets', async ({ page }) => {
  const errors = await open(page)
  await api(page, 'addMoney', 60000)
  await page.getByTestId('nav-shop').click()
  await page.getByTestId('tab-decor').click()
  await expect(page.getByTestId('shop-decor')).toBeVisible()
  for (const id of ['board-marble', 'wall-brick', 'mood-sunset', 'prop-plant', 'prop-candles', 'prop-lamp']) {
    await page.getByTestId(`decor-${id}`).getByTestId('buy').click()
  }
  await expect(page.getByTestId('decor-board-marble').getByTestId('equipped')).toBeVisible()
  await expect(page.getByTestId('decor-board-wood').getByTestId('equip')).toBeVisible()
  await expect(page.getByTestId('decor-prop-plant').getByTestId('toggle')).toContainText('Retirer')
  await shot(page, 'shop-decor')
  // retirer puis replacer un objet
  await page.getByTestId('decor-prop-plant').getByTestId('toggle').click()
  await expect(page.getByTestId('decor-prop-plant').getByTestId('toggle')).toContainText('Placer')
  await page.getByTestId('decor-prop-plant').getByTestId('toggle').click()
  await page.getByTestId('back').click()
  await api(page, 'startRound', 'rondelles', 42)
  await page.waitForTimeout(2500) // HDRI asynchrone
  await shot(page, 'decor-sunset')
  expect(errors).toEqual([])
})

test('qualité élevée : post-traitement actif, rendu valide (capture)', async ({ page }) => {
  test.setTimeout(120_000)
  const errors = await open(page, '?fx=high')
  await api(page, 'startRound', 'rondelles', 42)
  await page.waitForFunction(() => (window as any).__potato.getState().frames > 4, null, { timeout: 60000 })
  await page.waitForTimeout(2500)
  await api(page, 'peelFraction', 0.35)
  await page.waitForTimeout(1500)
  await shot(page, 'fx-high')
  expect((await state(page)).frames).toBeGreaterThan(4)
  expect(errors.filter((e) => !/deprecated|GPU stall/i.test(e))).toEqual([])
})

test('qualité ultra : profondeur de champ (capture)', async ({ page }) => {
  test.setTimeout(150_000)
  const errors = await open(page, '?fx=ultra')
  await api(page, 'startRound', 'frites', 100)
  await page.waitForFunction(() => (window as any).__potato.getState().frames > 3, null, { timeout: 90000 })
  await page.waitForTimeout(2500)
  await api(page, 'peelAll')
  await api(page, 'goToCutting')
  await page.waitForTimeout(2500)
  await shot(page, 'fx-ultra')
  expect(errors.filter((e) => !/deprecated|GPU stall/i.test(e))).toEqual([])
})
