import { test, expect } from '@playwright/test'
import { api, open, shot } from './helpers'

test('succès : toast au déblocage, vitrine dans Collection', async ({ page }) => {
  const errors = await open(page)
  await api(page, 'startRound', 'rondelles', 42)
  await page.waitForFunction(() => (window as any).__potato.getState().frames > 4)
  await api(page, 'peelAll')
  await api(page, 'goToCutting')
  await page.waitForTimeout(600)
  for (let p = -1.1; p <= 1.1; p += 0.11) await api(page, 'cutAt', 'x', p)
  await expect(page.getByTestId('achievement-toast')).toContainText('Première patate')
  await shot(page, 'achievement-toast')
  expect(errors).toEqual([])
})

test('vitrine des succès', async ({ page }) => {
  await open(page)
  await api(page, 'addMoney', 1500) // « Petit pécule »
  await expect(page.getByTestId('achievement-toast')).toBeVisible()
  await page.getByTestId('nav-collection').click()
  await expect(page.getByTestId('ach-rich-1k')).toContainText('Petit pécule')
  await expect(page.getByTestId('ach-rich-1k')).toHaveClass(/done/)
  await expect(page.getByTestId('ach-potatoes-50')).not.toHaveClass(/done/)
  await shot(page, 'achievements')
})
