import { describe, expect, it } from 'vitest'
import { createRng } from '../core/rng'
import { RARITIES, RARITY_META } from '../data/rarities'
import { openCrate, rollRarity } from './crate'

describe('crate', () => {
  it('déterministe avec une RNG seedée', () => {
    expect(openCrate(createRng(5), new Set())).toEqual(openCrate(createRng(5), new Set()))
  })
  it('distribution ±2 % sur 10 000 tirages', () => {
    const rng = createRng(123)
    const n = 10000
    const counts: Record<string, number> = {}
    for (let i = 0; i < n; i++) { const r = rollRarity(rng); counts[r] = (counts[r] ?? 0) + 1 }
    const total = RARITIES.reduce((s, r) => s + RARITY_META[r].crateWeight, 0)
    for (const r of RARITIES) expect(Math.abs((counts[r] ?? 0) / n - RARITY_META[r].crateWeight / total)).toBeLessThan(0.02)
  })
  it('doublon → remboursement, nouveau → 0', () => {
    const first = openCrate(createRng(9), new Set())
    expect(first.refund).toBe(0)
    const dup = openCrate(createRng(9), new Set([first.knifeId]))
    expect(dup.duplicate).toBe(true)
    expect(dup.refund).toBeGreaterThan(0)
  })
  it('ne tire jamais le couteau starter', () => {
    const rng = createRng(1)
    for (let i = 0; i < 500; i++) expect(openCrate(rng, new Set()).knifeId).not.toBe('office-rouille')
  })
})
