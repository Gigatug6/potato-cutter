import { test, expect } from '@playwright/test'
import { api, open, shot } from './helpers'

test('clients : une bulle par commande, le client servi repart', async ({ page }) => {
  const errors = await open(page)
  await page.waitForFunction(() => (window as any).__potato.getState().frames > 3)
  await api(page, 'setOrders', [
    { id: 'c1', dishId: 'chips', emoji: '🥔', mode: 'rondelles', minGrade: 'D', multiplier: 2, label: 'Chips croustillantes' },
    { id: 'c2', dishId: 'puree', emoji: '🥣', mode: 'des', minGrade: 'S', multiplier: 1.4, label: 'Purée rustique' },
    { id: 'c3', dishId: 'rosti', emoji: '🥞', mode: 'frites', minGrade: 'S', multiplier: 3, label: 'Rösti parfait' },
  ])
  await expect(page.getByTestId('bubble-chips')).toBeVisible({ timeout: 15000 })
  await expect(page.getByTestId('bubble-puree')).toBeVisible()
  await expect(page.getByTestId('bubble-rosti')).toBeVisible()
  await page.waitForTimeout(1500)
  await api(page, 'startRound', 'rondelles', 42)
  await page.waitForTimeout(1200)
  await shot(page, 'customers')

  // servir la commande « chips »
  await api(page, 'startRound', 'rondelles', 42)
  await page.waitForTimeout(500)
  await api(page, 'peelAll')
  await api(page, 'goToCutting')
  await page.waitForTimeout(600)
  for (let p = -1.1; p <= 1.1; p += 0.11) await api(page, 'cutAt', 'x', p)
  await expect(page.getByTestId('order-delivered')).toContainText('Chips')
  // le client servi repart (la bulle disparaît un instant), un nouveau client arrive : 3 bulles à nouveau
  await page.waitForTimeout(4000) // saut de joie + départ du client servi, arrivée du suivant
  await expect(page.locator('.bubble')).toHaveCount(3)
  await expect(page.getByTestId('bubble-puree')).toBeVisible()
  await expect(page.getByTestId('bubble-rosti')).toBeVisible()
  expect(errors).toEqual([])
})
