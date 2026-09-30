import { test, expect } from '@playwright/test'
import { api, open, state } from './helpers'

test('manette : curseur virtuel, A éplucher, A trancher, Start', async ({ page }) => {
  await page.addInitScript(() => {
    const pad: any = { connected: true, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false })), id: 'fake', index: 0 }
    ;(window as any).__pad = pad
    navigator.getGamepads = () => [pad] as any
  })
  const errors = await open(page)
  const setPad = (axes: number[], pressed: number[] = []) => page.evaluate(([a, p]) => {
    const pad = (window as any).__pad
    pad.axes = a
    pad.buttons = pad.buttons.map((_: unknown, i: number) => ({ pressed: (p as number[]).includes(i) }))
  }, [axes, pressed] as const)

  await api(page, 'startRound', 'rondelles', 42)
  await page.waitForFunction(() => (window as any).__potato.getState().frames > 4)
  await page.waitForTimeout(800)
  // stick vers la gauche, A maintenu, balayage vers la droite
  await setPad([-0.6, 0.0])
  await page.waitForTimeout(300)
  await expect(page.getByTestId('pad-cursor')).toBeVisible()
  await setPad([0, 0], [0])
  await page.waitForTimeout(150)
  await setPad([0.9, 0.05], [0])
  await page.waitForTimeout(900)
  await setPad([0, 0])
  await page.waitForTimeout(200)
  expect((await state(page)).peelCoverage).toBeGreaterThan(0.01)

  await api(page, 'peelAll')
  await setPad([0, 0], [9]) // Start → découpe
  await page.waitForTimeout(150)
  await setPad([0, 0])
  await expect.poll(async () => (await state(page)).phase).toBe('cutting')
  await page.waitForTimeout(900)
  await setPad([0, 0], [5]) // RB : place le couteau
  await page.waitForTimeout(100)
  await setPad([0, 0])
  await setPad([0, 0], [0]) // A : tranche
  await page.waitForTimeout(150)
  await setPad([0, 0])
  await page.waitForTimeout(400)
  expect((await state(page)).cutCount).toBeGreaterThanOrEqual(1)
  expect(errors).toEqual([])
})
