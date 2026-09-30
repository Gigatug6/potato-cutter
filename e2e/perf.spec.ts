import { test, expect } from '@playwright/test'
import { api, open, state } from './helpers'

test('5 manches enchaînées : pas de fuite GPU, pas d’erreur', async ({ page }) => {
  const errors = await open(page)
  const counts: number[] = []
  for (let round = 0; round < 5; round++) {
    await api(page, 'startRound', 'frites', 100 + round)
    await page.waitForTimeout(300)
    await api(page, 'peelAll')
    await api(page, 'goToCutting')
    await page.waitForTimeout(400)
    for (const [axis, n] of [['y', 4], ['z', 4]] as const) {
      let done = 0
      for (let p = -0.8; p <= 0.8 && done < n; p += 0.05) if (await api<boolean>(page, 'cutAt', axis, p)) done++
    }
    await page.waitForTimeout(300)
    const s = await state(page)
    expect(s.phase).toBe('results')
    counts.push(s.geometries)
  }
  // la 5e manche ne doit pas avoir plus de géométries que la 2e + marge (pas de fuite cumulée)
  expect(counts[4]).toBeLessThanOrEqual(counts[1] + 10)
  const s = await state(page)
  expect(s.textures).toBeLessThan(10)
  expect(errors).toEqual([])
})

test('perte du contexte WebGL : message + bouton recharger', async ({ page }) => {
  await open(page)
  await page.evaluate(() => {
    const gl = document.querySelector('canvas')!.getContext('webgl2')!
    gl.getExtension('WEBGL_lose_context')!.loseContext()
  })
  await expect(page.getByTestId('context-lost')).toBeVisible()
})
