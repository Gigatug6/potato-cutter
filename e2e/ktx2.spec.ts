import { test, expect } from '@playwright/test'
import { api, open, shot, state } from './helpers'

test('textures KTX2 : montée en gamme depuis le WebP, rendu inchangé, sans erreur', async ({ page }) => {
  test.setTimeout(120_000)
  const errors = await open(page)
  await api(page, 'startRound', 'rondelles', 42)
  await page.waitForFunction(() => (window as any).__potato.getState().frames > 4)
  // planche (bois) + patate (peau) + éplucheur (métal) : au moins 3 textures compressées en service
  await page.waitForFunction(() => (window as any).__potato.getState().ktx2 >= 3, null, { timeout: 60_000, polling: 500 })
  await api(page, 'peelFraction', 0.35)
  await page.waitForTimeout(800)
  await shot(page, 'ktx2')
  expect((await state(page)).ktx2).toBeGreaterThanOrEqual(3)
  expect(errors).toEqual([])
})
