import { test, expect } from '@playwright/test'
import { api, open, shot, state } from './helpers'

test('sauvegarde en ligne : créer un code, modifier, récupérer', async ({ page }) => {
  const errors = await open(page)
  await api(page, 'addMoney', 777)
  await page.waitForTimeout(400)
  await page.getByTestId('nav-settings').click()
  await page.getByTestId('cloud-create').click()
  await expect(page.getByTestId('cloud-msg')).toContainText('Code créé')
  const code = await page.getByTestId('sync-code').inputValue()
  expect(code).toMatch(/^[A-Z2-7]{4}(-[A-Z2-7]{4}){3}$/)

  await api(page, 'addMoney', 5000) // modification locale non synchronisée
  expect((await state(page)).money).toBeGreaterThan(5000)
  await page.getByTestId('cloud-pull').click()
  await expect(page.getByTestId('replace-confirm')).toBeVisible()
  await shot(page, 'cloud-confirm')
  await page.getByTestId('replace-yes').click()
  await expect(page.getByTestId('cloud-msg')).toContainText('restaurée')
  const money = (await state(page)).money
  expect(money).toBeLessThan(5000)
  expect(money).toBeGreaterThanOrEqual(777)

  // code inconnu
  await page.getByTestId('sync-code').fill('ZZZZ-ZZZZ-ZZZZ-ZZZZ')
  await page.getByTestId('cloud-pull').click()
  await expect(page.getByTestId('cloud-msg')).toContainText('Code inconnu')
  await page.getByTestId('sync-code').fill('abc')
  await page.getByTestId('cloud-push').click()
  await expect(page.getByTestId('cloud-msg')).toContainText('Code invalide')
  expect(errors.filter((e) => !/404|Failed to load resource/.test(e))).toEqual([])
})

test('fichier : export puis import (confirmation)', async ({ page }) => {
  await open(page)
  await api(page, 'addMoney', 321)
  await page.waitForTimeout(400)
  await page.getByTestId('nav-settings').click()
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('file-export').click()])
  expect(download.suggestedFilename()).toMatch(/^potato-cutter-save-\d{4}-\d{2}-\d{2}\.json$/)
  const path = await download.path()
  await api(page, 'addMoney', 9000)
  await page.getByTestId('file-input').setInputFiles(path)
  await page.getByTestId('replace-yes').click()
  await expect(page.getByTestId('cloud-msg')).toContainText('restaurée')
  expect((await state(page)).money).toBeLessThan(9000)
  await page.getByTestId('file-input').setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: (globalThis as any).Buffer.from('nope') })
  await expect(page.getByTestId('cloud-msg')).toContainText('invalide')
})
