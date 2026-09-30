import { describe, expect, it } from 'vitest'
import { createRng } from './rng'

describe('rng', () => {
  it('est déterministe', () => {
    const a = createRng(42), b = createRng(42)
    for (let i = 0; i < 10; i++) expect(a()).toBe(b())
  })
  it('reste dans [0,1[', () => {
    const r = createRng(1)
    for (let i = 0; i < 1000; i++) { const v = r(); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1) }
  })
  it('graines différentes → suites différentes', () => {
    expect(createRng(1)()).not.toBe(createRng(2)())
  })
})
