import { test, expect } from '@playwright/test'
import { api, open, shot, state } from './helpers'

test('découpe en rondelles : coupes, pièces, fin de manche, pas de fuite', async ({ page }) => {
  const errors = await open(page)
  await api(page, 'startRound', 'rondelles', 42)
  await page.waitForTimeout(500)
  await api(page, 'peelAll')
  await api(page, 'goToCutting')
  await page.waitForTimeout(800)
  expect(await api<boolean>(page, 'cutAt', 'x', 0)).toBe(true)
  await page.waitForTimeout(300)
  expect((await state(page)).pieceCount).toBe(2)

  // vrais clics de souris
  const box = (await page.locator('canvas').boundingBox())!
  const y = box.y + box.height * 0.5
  for (const f of [0.4, 0.47, 0.55, 0.62]) {
    await page.mouse.move(box.x + box.width * f, y)
    await page.mouse.down()
    await page.mouse.up()
    await page.waitForTimeout(150)
  }
  const mid = await state(page)
  expect(mid.cutCount).toBeGreaterThanOrEqual(4)
  await shot(page, 'cut-rondelles')

  // fuite : les géométries ne doivent pas exploser après de nouvelles coupes
  const g0 = mid.geometries
  for (let p = -1.1; p <= 1.1; p += 0.11) await api(page, 'cutAt', 'x', p)
  await page.waitForTimeout(300)
  const end = await state(page)
  expect(end.geometries).toBeLessThan(g0 + 30)
  expect(end.phase).toBe('results')
  expect(end.money).toBeGreaterThan(0)
  expect(errors).toEqual([])
})
