import { test, expect } from '@playwright/test'
import { api, open, shot, state } from './helpers'

test('épluchage à la souris augmente la couverture', async ({ page }) => {
  const errors = await open(page)
  await api(page, 'startRound', 'rondelles', 42)
  await page.waitForTimeout(800)
  const box = (await page.locator('canvas').boundingBox())!
  const cx = box.x + box.width / 2, cy = box.y + box.height * 0.52
  // drag hors de la patate : rien de pelé
  await page.mouse.move(box.x + 20, box.y + 20)
  await page.mouse.down()
  await page.mouse.move(box.x + 80, box.y + 40, { steps: 5 })
  await page.mouse.up()
  expect((await state(page)).peelCoverage).toBe(0)
  // allers-retours sur la patate
  await page.mouse.move(cx - 120, cy)
  await page.mouse.down()
  for (let i = 0; i < 5; i++) {
    await page.mouse.move(cx + 120, cy + (i - 2) * 20, { steps: 12 })
    await page.mouse.move(cx - 120, cy + (i - 2) * 20 + 10, { steps: 12 })
  }
  await page.mouse.up()
  await page.waitForTimeout(200)
  expect((await state(page)).peelCoverage).toBeGreaterThan(0.02)
  await shot(page, 'peel-partial')
  expect(errors).toEqual([])
})
