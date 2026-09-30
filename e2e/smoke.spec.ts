import { test, expect } from '@playwright/test'

test('la page charge et WebGL est disponible', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  await page.goto('/')
  await expect(page).toHaveTitle(/Potato/)
  const webgl = await page.evaluate(() => !!document.createElement('canvas').getContext('webgl2'))
  expect(webgl).toBe(true)
  expect(errors).toEqual([])
})
