import { test, expect } from '@playwright/test'
import { open, state } from './helpers'

test('musique : démarre au premier geste, se coupe à volume 0', async ({ page }) => {
  const errors = await open(page)
  expect((await state(page)).musicRunning).toBe(false)
  await page.mouse.click(400, 300) // geste utilisateur
  await expect.poll(async () => (await state(page)).musicRunning).toBe(true)
  await page.getByTestId('nav-settings').click()
  await page.getByTestId('opt-music').fill('0')
  await expect.poll(async () => (await state(page)).musicRunning).toBe(false)
  await page.getByTestId('opt-music').fill('0.5')
  await expect.poll(async () => (await state(page)).musicRunning).toBe(true)
  expect(errors).toEqual([])
})
