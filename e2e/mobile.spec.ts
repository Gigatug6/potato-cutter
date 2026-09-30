import { test, expect } from '@playwright/test'
import { api, open, shot, state } from './helpers'

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

test('mobile : pas de scroll horizontal, épluchage tactile, coupe au tap', async ({ page }) => {
  const errors = await open(page)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
  expect(overflow).toBe(false)
  await shot(page, 'mobile-menu')
  await page.getByTestId('play').tap()
  await page.waitForTimeout(1200)
  await shot(page, 'mobile-game')

  // gestes tactiles via PointerEvent (pas de drag tactile natif dans Playwright)
  const box = (await page.locator('canvas').boundingBox())!
  await page.evaluate(({ x, y, w }) => {
    const c = document.querySelector('canvas')!
    const fire = (type: string, px: number, py: number) =>
      c.dispatchEvent(new PointerEvent(type, { pointerType: 'touch', pointerId: 7, clientX: px, clientY: py, bubbles: true, isPrimary: true }))
    fire('pointerdown', x - w, y)
    for (let k = 0; k < 6; k++) {
      for (let i = 0; i <= 12; i++) fire('pointermove', x - w + (2 * w * i) / 12, y + (k - 3) * 25)
    }
    window.dispatchEvent(new PointerEvent('pointerup', { pointerType: 'touch', pointerId: 7, bubbles: true }))
  }, { x: box.x + box.width / 2, y: box.y + box.height * 0.5, w: 110 })
  await page.waitForTimeout(300)
  expect((await state(page)).peelCoverage).toBeGreaterThan(0.02)

  await api(page, 'peelAll')
  await page.getByTestId('to-cutting').tap()
  await page.waitForTimeout(1000)
  await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.5)
  await page.waitForTimeout(300)
  expect((await state(page)).cutCount).toBe(1)
  await shot(page, 'mobile-cut')
  // setPointerCapture échoue sur les PointerEvent synthétiques (pointerId fictif) : artefact du test
  expect(errors.filter((e) => !e.includes('setPointerCapture'))).toEqual([])
})
