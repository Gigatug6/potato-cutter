import { test, expect } from '@playwright/test'
import { api, open, shot, state } from './helpers'

test('rotation 3D de la patate : mode tourner et clic droit, sans éplucher', async ({ page }) => {
  const errors = await open(page)
  await page.getByTestId('play').click()
  await page.waitForFunction(() => (window as any).__potato.getState().frames > 10)
  await page.waitForTimeout(800)
  const box = (await page.locator('canvas').boundingBox())!
  const cx = box.x + box.width / 2, cy = box.y + box.height * 0.5
  const before = await page.screenshot({ clip: { x: cx - 200, y: cy - 120, width: 400, height: 240 } })

  await page.getByTestId('rotate-toggle').click()
  await page.mouse.move(cx - 50, cy)
  await page.mouse.down()
  await page.mouse.move(cx + 120, cy + 40, { steps: 10 })
  await page.mouse.up()
  await page.waitForTimeout(300)
  expect((await state(page)).peelCoverage).toBe(0) // tourner n'épluche pas
  const after = await page.screenshot({ clip: { x: cx - 200, y: cy - 120, width: 400, height: 240 } })
  expect(after.equals(before)).toBe(false)
  await shot(page, 'rotated')

  // clic droit : tourner aussi, sans mode
  await page.getByTestId('rotate-toggle').click()
  await page.mouse.move(cx - 50, cy)
  await page.mouse.down({ button: 'right' })
  await page.mouse.move(cx + 60, cy - 30, { steps: 8 })
  await page.mouse.up({ button: 'right' })
  expect((await state(page)).peelCoverage).toBe(0)
  void api
  expect(errors).toEqual([])
})
