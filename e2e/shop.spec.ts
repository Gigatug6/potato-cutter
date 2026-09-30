import { test, expect } from '@playwright/test'
import { api, open, shot } from './helpers'

test('boutique : achat, équipement, persistance après reload, caisse, reset', async ({ page }) => {
  const errors = await open(page)
  // addInitScript vide le localStorage à chaque chargement : on le neutralise après le 1er
  await page.evaluate(() => (window as any).__potato.addMoney(20000))
  await page.getByTestId('nav-shop').click()
  await expect(page.getByTestId('shop')).toBeVisible()
  await expect(page.getByTestId('knife-excalipatate')).toContainText('Caisse uniquement')
  await page.getByTestId('knife-chef-azur').getByTestId('buy').click()
  await page.getByTestId('knife-chef-azur').getByTestId('equip').click()
  await expect(page.getByTestId('knife-chef-azur').getByTestId('equipped')).toBeVisible()
  await shot(page, 'shop')
  await page.getByTestId('open-crate').click()
  await expect(page.getByTestId('crate-result')).toBeVisible({ timeout: 5000 })
  await shot(page, 'crate')
  await page.waitForTimeout(600) // debounce de sauvegarde
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('potato-cutter:save')!))
  expect(saved.equippedKnifeId).toBe('chef-azur')
  expect(saved.ownedKnives['chef-azur']).toBeTruthy()
  expect(saved.counters.crates).toBe(1) // la caisse a bien été ouverte (les succès créditent aussi des Patacoins : on ne compare plus le solde exact)
  expect(saved.money).toBeLessThan(20000)
  expect(errors).toEqual([])
})

test('persistance après reload', async ({ page }) => {
  await page.goto('/')
  await page.waitForFunction(() => (window as any).__potato)
  await page.evaluate(() => { localStorage.clear(); (window as any).__potato.addMoney(5000) })
  await page.waitForTimeout(600)
  await page.reload()
  await page.waitForFunction(() => (window as any).__potato)
  await expect(page.getByTestId('money')).toContainText('5')
  await page.getByTestId('nav-shop').click()
  await page.getByTestId('knife-chef-azur').getByTestId('buy').click()
  await page.getByTestId('knife-chef-azur').getByTestId('equip').click()
  await page.waitForTimeout(600)
  await page.reload()
  await page.waitForFunction(() => (window as any).__potato)
  await page.getByTestId('nav-shop').click()
  await expect(page.getByTestId('knife-chef-azur').getByTestId('equipped')).toBeVisible()
})

test('réglages : la réinitialisation remet l’argent à 0', async ({ page }) => {
  await page.goto('/')
  await page.waitForFunction(() => (window as any).__potato)
  await page.evaluate(() => (window as any).__potato.addMoney(300))
  await page.getByTestId('nav-settings').click()
  await page.getByTestId('reset').click()
  await page.getByTestId('reset').click()
  await page.getByTestId('back').click()
  await expect(page.getByTestId('money')).toContainText('0')
  void api
})
