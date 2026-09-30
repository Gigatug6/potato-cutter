import { describe, expect, it } from 'vitest'
import { BAD_CHANCE, POTATOES, STARTER_POTATO_ID, badKindForSeed } from './potatoes'
import { UPGRADES, autoPeelSpeed, potatoScale, upgradePrice, upgradeValueMult } from './upgrades'

describe('potatoes', () => {
  it('ids uniques, une seule gratuite (starter), valeur et prix croissants', () => {
    expect(new Set(POTATOES.map((p) => p.id)).size).toBe(POTATOES.length)
    expect(POTATOES.filter((p) => p.price === 0).map((p) => p.id)).toEqual([STARTER_POTATO_ID])
    for (let i = 1; i < POTATOES.length; i++) {
      expect(POTATOES[i].price).toBeGreaterThan(POTATOES[i - 1].price)
      expect(POTATOES[i].valueMult).toBeGreaterThan(POTATOES[i - 1].valueMult)
    }
  })
  it('patate abîmée : déterministe et ~12 %', () => {
    expect(badKindForSeed(5)).toBe(badKindForSeed(5))
    let bad = 0
    const n = 20000
    for (let i = 0; i < n; i++) if (badKindForSeed(i * 7919 + 13)) bad++
    expect(Math.abs(bad / n - BAD_CHANCE)).toBeLessThan(0.02)
  })
  it('seeds utilisées par les e2e ne sont pas abîmées', () => {
    for (const s of [42, 8, 100, 101, 102, 103, 104]) expect(badKindForSeed(s)).toBeNull()
  })
})

describe('upgrades', () => {
  it('prix croissants, null au maximum', () => {
    for (const u of UPGRADES) {
      let prev = 0
      for (let l = 0; l < u.max; l++) {
        const p = upgradePrice(u, l)!
        expect(p).toBeGreaterThan(prev)
        prev = p
      }
      expect(upgradePrice(u, u.max)).toBeNull()
    }
  })
  it('effets', () => {
    expect(autoPeelSpeed(0)).toBe(0)
    expect(autoPeelSpeed(3)).toBeGreaterThan(autoPeelSpeed(1))
    expect(potatoScale(2)).toBeCloseTo(1.1)
    expect(upgradeValueMult({})).toBe(1)
    expect(upgradeValueMult({ bigPotatoes: 5, goldenBoard: 5 })).toBeCloseTo(2 * 1.5)
  })
})
