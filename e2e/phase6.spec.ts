import { test, expect } from '@playwright/test'
import { api, open, shot, state } from './helpers'

test('boutique : patates, améliorations, aperçu 3D du couteau', async ({ page }) => {
  const errors = await open(page)
  await api(page, 'addMoney', 5000)
  await page.getByTestId('nav-shop').click()

  // aperçu 3D : un canvas, le nom change quand on sélectionne une autre carte
  await expect(page.getByTestId('knife-preview').locator('canvas')).toBeVisible()
  await expect(page.getByTestId('preview-name')).toContainText('Office rouillé')
  await page.getByTestId('knife-chef-azur').click()
  await expect(page.getByTestId('preview-name')).toContainText('Chef Azur')
  await shot(page, 'shop-preview')

  // patates
  await page.getByTestId('tab-potatoes').click()
  await page.getByTestId('potato-ratte').getByTestId('buy').click()
  await expect(page.getByTestId('potato-ratte').getByTestId('selected')).toBeVisible()
  await shot(page, 'shop-potatoes')

  // améliorations
  await page.getByTestId('tab-upgrades').click()
  await page.getByTestId('upgrade-goldenBoard').getByTestId('buy').click()
  await expect(page.getByTestId('upgrade-goldenBoard').getByTestId('level')).toContainText('Niveau 1/5')
  await shot(page, 'shop-upgrades')

  await page.getByTestId('back').click()
  await expect(page.getByTestId('pick-ratte')).toBeVisible()
  expect(errors).toEqual([])
})

test('commandes et quêtes du jour', async ({ page }) => {
  const errors = await open(page)
  await expect(page.getByTestId('orders').locator('li')).toHaveCount(3)
  await expect(page.getByTestId('quests').locator('li')).toHaveCount(3)
  await expect(page.getByTestId('claim').first()).toBeDisabled()
  await shot(page, 'menu-orders-quests')

  await api(page, 'completeQuests')
  const before = (await state(page)).money
  await page.getByTestId('claim').first().click()
  await expect.poll(async () => (await state(page)).money).toBeGreaterThan(before)

  // commande livrée : rondelles, note ≥ D => toujours satisfaite
  await api(page, 'setOrders', [
    { id: 'z1', dishId: 'chips', mode: 'rondelles', minGrade: 'D', multiplier: 2, label: 'Chips croustillantes' },
    { id: 'z2', dishId: 'puree', mode: 'des', minGrade: 'S', multiplier: 1.4, label: 'Purée rustique' },
    { id: 'z3', dishId: 'rosti', mode: 'frites', minGrade: 'S', multiplier: 3, label: 'Rösti parfait' },
  ])
  await api(page, 'startRound', 'rondelles', 42)
  await page.waitForTimeout(400)
  await api(page, 'peelAll')
  await api(page, 'goToCutting')
  await page.waitForTimeout(600)
  for (let p = -1.1; p <= 1.1; p += 0.11) await api(page, 'cutAt', 'x', p)
  await expect(page.getByTestId('order-delivered')).toContainText('Chips croustillantes')
  await shot(page, 'order-delivered')
  expect(errors).toEqual([])
})

test('chrono 60 s : timer, fin, classement', async ({ page }) => {
  const errors = await open(page)
  await page.getByTestId('play-challenge').click()
  await expect(page.getByTestId('challenge-timer')).toBeVisible()
  await page.waitForFunction(() => (window as any).__potato.getState().frames > 5)
  // un tour complet pendant le chrono
  await api(page, 'peelAll')
  await api(page, 'goToCutting')
  await page.waitForTimeout(500)
  for (let p = -1.1; p <= 1.1; p += 0.11) await api(page, 'cutAt', 'x', p)
  // les résultats s'enchaînent tout seuls sur une nouvelle patate
  await expect.poll(async () => (await state(page)).phase, { timeout: 15000 }).toBe('peeling')
  expect((await state(page)).challenge!.potatoes).toBe(1)
  await api(page, 'setChallengeEnd', 1200)
  await expect(page.getByTestId('challenge-result')).toBeVisible({ timeout: 15000 })
  await expect(page.getByTestId('rank')).toContainText('n°1')
  await shot(page, 'challenge-result')
  await page.getByText('Menu', { exact: true }).click()
  await page.getByTestId('nav-collection').click()
  await expect(page.getByTestId('leaderboard').locator('li')).toHaveCount(1)
  expect(errors).toEqual([])
})

test('patate pourrie : bandeau et bouton Jeter', async ({ page }) => {
  const errors = await open(page)
  await api(page, 'startRound', 'rondelles', 101, 'rotten')
  await page.waitForFunction(() => (window as any).__potato.getState().frames > 5)
  await expect(page.getByTestId('bad-banner')).toBeVisible()
  await shot(page, 'rotten-banner')
  const before = await state(page)
  expect(before.bad).toBe('rotten')
  await page.getByTestId('discard').click()
  await expect.poll(async () => (await state(page)).seed).not.toBe(before.seed)
  expect((await state(page)).phase).toBe('peeling')
  expect((await state(page)).money).toBe(before.money) // aucune pénalité
  expect(errors).toEqual([])
})

test('éplucheur automatique : la patate s’épluche toute seule', async ({ page }) => {
  const errors = await open(page)
  await api(page, 'setUpgrade', 'autoPeeler', 5)
  await api(page, 'startRound', 'rondelles', 42)
  await page.waitForFunction(() => (window as any).__potato.getState().peelCoverage > 0.03, null, { timeout: 25000 })
  await shot(page, 'auto-peeler')
  expect(errors).toEqual([])
})
