import { test, expect } from '@playwright/test'
import { api, open } from './helpers'

test('langue : anglais à la volée (textes, données, attributs), retour au français, persistance', async ({ page }) => {
  const errors = await open(page)
  await expect(page.getByTestId('play')).toHaveText('Jouer')
  await page.getByTestId('nav-settings').click()
  await page.getByTestId('opt-lang').selectOption('en')
  await page.getByTestId('back').click()
  await expect(page.getByTestId('play')).toHaveText('Play')
  await expect(page.getByTestId('nav-shop')).toHaveText('Shop')
  await expect(page.getByTestId('orders')).toContainText('Orders')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')

  // données traduites + texte dynamique (Vue met à jour le DOM après coup)
  await page.getByTestId('nav-shop').click()
  await expect(page.getByTestId('tab-knives')).toHaveText('🔪 Knives')
  await expect(page.getByTestId('knife-chef-azur')).toContainText('Azure Chef')
  await expect(page.getByTestId('knife-chef-azur')).toContainText('Earnings ×1.7')
  await page.getByTestId('tab-decor').click()
  await expect(page.getByTestId('decor-board-marble')).toContainText('Marble')
  await page.getByTestId('back').click()
  await api(page, 'startRound', 'rondelles', 42)
  await expect(page.getByTestId('peel')).toContainText('Peeled')
  await expect(page.locator('canvas')).toHaveAttribute('aria-label', /3D worktop/)
  await expect(page).toHaveTitle(/In game/)

  // persistance après rechargement
  await page.waitForTimeout(600)
  await page.reload()
  await page.waitForFunction(() => (window as any).__potato)
  await expect(page.getByTestId('play')).toHaveText('Play')

  // retour au français
  await page.getByTestId('nav-settings').click()
  await page.getByTestId('opt-lang').selectOption('fr')
  await page.getByTestId('back').click()
  await expect(page.getByTestId('play')).toHaveText('Jouer')
  await expect(page.getByTestId('nav-shop')).toHaveText('Boutique')
  expect(errors).toEqual([])
})

test('bouton de langue du menu + capture de la boutique en anglais', async ({ page }) => {
  await open(page)
  await page.getByTestId('lang-toggle').click()
  await expect(page.getByTestId('play')).toHaveText('Play')
  await page.getByTestId('nav-shop').click()
  await page.waitForTimeout(600)
  const { shot } = await import('./helpers')
  await shot(page, 'shop-en')
})
