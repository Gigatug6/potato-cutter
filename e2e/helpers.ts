import type { Page } from '@playwright/test'

export type PotatoState = {
  phase: string; screen: string; mode: string | null; peelCoverage: number; cutCount: number; pieceCount: number
  seed: number | null; bad: string | null; challenge: { score: number; potatoes: number; done: boolean; rank: number | null } | null
  musicRunning: boolean
  money: number; frames: number; drawCalls: number; triangles: number; geometries: number; textures: number
  result: { reward: number; grade: string } | null
}

export const state = (page: Page) => page.evaluate(() => (window as any).__potato.getState() as PotatoState)
export const api = <T>(page: Page, fn: string, ...args: unknown[]) =>
  page.evaluate(([f, a]) => (window as any).__potato[f as string](...(a as unknown[])) as T, [fn, args] as const)
export const shot = (page: Page, name: string) => page.screenshot({ path: `artifacts/screens/${name}.png` })

export async function open(page: Page, query = '') {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  await page.goto('/' + query)
  await page.waitForFunction(() => (window as any).__potato)
  return errors
}
