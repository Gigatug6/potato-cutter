import { test, expect } from '@playwright/test'
import { open, shot, state } from './helpers'

test('partie complète via l’UI : menu → épluchage → découpe → résultats', async ({ page }) => {
  const errors = await open(page)
  await shot(page, 'menu')
  await page.getByTestId('play').click()
  await expect(page.getByTestId('hud')).toBeVisible()
  await expect(page.getByTestId('to-cutting')).toBeDisabled()
  await page.evaluate(() => (window as any).__potato.peelAll())
  await expect(page.getByTestId('to-cutting')).toBeEnabled()
  await shot(page, 'hud-peeled')
  await page.getByTestId('to-cutting').click()
  await page.waitForTimeout(700)
  for (let p = -1.1; p <= 1.1; p += 0.11) await page.evaluate((x) => (window as any).__potato.cutAt('x', x), p)
  await expect(page.getByTestId('results')).toBeVisible()
  await shot(page, 'results')
  const s = await state(page)
  expect(s.money).toBeGreaterThan(0)
  await expect(page.getByTestId('reward')).toContainText('+')
  await page.getByTestId('next').click()
  await expect(page.getByTestId('peel')).toContainText('0 %')
  expect(errors).toEqual([])
})
