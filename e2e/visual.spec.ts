import { test, expect } from '@playwright/test'
import { api, open, shot, state } from './helpers'

async function ready(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => (window as any).__potato.getState().frames > 10)
  await page.waitForTimeout(500)
}

test('variétés, patate pourrie, couteau en survol, friteuse (captures)', async ({ page }) => {
  const errors = await open(page)
  await api(page, 'unlockPotato', 'violette')
  await api(page, 'startRound', 'frites', 100)
  await ready(page)
  await api(page, 'peelFraction', 0.4)
  await page.waitForTimeout(300)
  await shot(page, 'violette-peeling')
  await api(page, 'peelAll')
  await api(page, 'goToCutting')
  await page.waitForTimeout(900)
  const box = (await page.locator('canvas').boundingBox())!
  await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.5)
  await page.waitForTimeout(700)
  await shot(page, 'knife-hover')
  for (const [axis, n] of [['y', 4], ['z', 4]] as const) {
    let done = 0
    for (let p = -0.7; p <= 0.7 && done < n; p += 0.05) if (await api<boolean>(page, 'cutAt', axis, p)) done++
  }
  await page.waitForTimeout(150)
  await shot(page, 'fry-start')
  await page.waitForTimeout(500)
  await shot(page, 'fry-mid')
  await expect(page.getByTestId('results')).toBeVisible()
  await shot(page, 'fry-results')

  // patate verte
  await api(page, 'unlockPotato', 'bintje')
  await api(page, 'startRound', 'rondelles', 101, 'green')
  await ready(page)
  await api(page, 'peelFraction', 0.3)
  await page.waitForTimeout(300)
  await shot(page, 'green-potato')
  expect((await state(page)).phase).toBe('peeling')
  expect(errors).toEqual([])
})
