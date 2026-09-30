import { test, expect } from '@playwright/test'
import { api, open, shot } from './helpers'

test.use({ viewport: { width: 640, height: 360 } })

test('ray tracing : path tracing GPU progressif, retour au jeu', async ({ page }) => {
  test.setTimeout(240_000)
  const errors = await open(page)
  await api(page, 'startRound', 'rondelles', 42)
  await page.waitForFunction(() => (window as any).__potato.getState().frames > 4)
  await page.waitForTimeout(1500)
  await api(page, 'peelFraction', 0.5)
  await page.waitForTimeout(500)
  await page.getByTestId('rt-start').click()
  // shaders lourds en WebGL logiciel : on attend quelques échantillons (ou une erreur explicite)
  await expect(page.getByTestId('rt-stop')).toBeVisible({ timeout: 90_000 })
  await page.waitForFunction(() => (window as any).__potato.getState().photo.samples >= 3, null, { timeout: 200_000, polling: 1000 })
  await shot(page, 'raytracing')
  await page.getByTestId('rt-stop').click()
  await expect(page.getByTestId('rt-start')).toBeVisible()
  const frames1 = await page.evaluate(() => (window as any).__potato.getState().frames)
  await page.waitForTimeout(1500)
  const frames2 = await page.evaluate(() => (window as any).__potato.getState().frames)
  expect(frames2).toBeGreaterThan(frames1) // le rendu temps réel a repris
  expect(errors.filter((e) => !/deprecated|GPU stall|WARNING/i.test(e))).toEqual([])
})
