import { test, expect } from '@playwright/test'
import { api, open, shot, state } from './helpers'

test('la page charge, WebGL rend des frames, sans erreur console', async ({ page }) => {
  const errors = await open(page)
  await expect(page).toHaveTitle(/Potato/)
  await api(page, 'startRound', 'rondelles', 42)
  await page.waitForTimeout(800)
  const s = await state(page)
  expect(s.frames).toBeGreaterThan(10)
  expect(s.triangles).toBeGreaterThan(5000)
  await shot(page, 'smoke-potato')
  expect(errors).toEqual([])
})
