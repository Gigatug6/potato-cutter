import { test, expect } from '@playwright/test'
import { api, open } from './helpers'

test('capture : PNG filigrané téléchargé, succès « Photographe »', async ({ page }) => {
  const errors = await open(page)
  await api(page, 'startRound', 'rondelles', 42)
  await page.waitForFunction(() => (window as any).__potato.getState().frames > 4)
  await page.waitForTimeout(800)
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('shot').click()])
  expect(download.suggestedFilename()).toMatch(/^potato-cutter-\d{8}-\d{6}\.png$/)
  await expect(page.getByTestId('shot-toast')).toBeVisible()
  await expect(page.getByTestId('achievement-toast')).toContainText('Photographe')
  expect(errors).toEqual([])
})
