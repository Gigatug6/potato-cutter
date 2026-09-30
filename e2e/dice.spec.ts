import { test, expect } from '@playwright/test'
import { api, open, shot, state } from './helpers'

test('mode dés : 3 passes, beaucoup de pièces', async ({ page }) => {
  const errors = await open(page)
  await api(page, 'startRound', 'des', 8)
  await page.waitForTimeout(400)
  await api(page, 'peelAll')
  await api(page, 'goToCutting')
  await page.waitForTimeout(600)
  const passes: [string, number[], number][] = [
    ['x', [-0.9, -0.55, -0.2, 0.2, 0.55, 0.9], 5],
    ['y', [-0.6, -0.25, 0.1, 0.45], 4],
    ['z', [-0.5, -0.2, 0.1, 0.4], 4],
  ]
  for (const [axis, positions, n] of passes) {
    let done = 0
    for (const p of positions) if (done < n && (await api<boolean>(page, 'cutAt', axis, p))) done++
    await page.waitForTimeout(500)
    if (axis === 'y') await shot(page, 'dice-mid')
  }
  const s = await state(page)
  expect(s.pieceCount).toBeGreaterThan(60)
  expect(s.phase).toBe('results')
  await shot(page, 'dice-final')
  expect(errors).toEqual([])
})
