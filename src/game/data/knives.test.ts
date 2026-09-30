import { describe, expect, it } from 'vitest'
import { KNIVES, STARTER_KNIFE_ID } from './knives'
import { RARITY_META } from './rarities'

describe('catalogue de couteaux', () => {
  it('ids uniques', () => expect(new Set(KNIVES.map((k) => k.id)).size).toBe(KNIVES.length))
  it('un seul starter à prix 0', () => {
    const free = KNIVES.filter((k) => k.price === 0)
    expect(free.map((k) => k.id)).toEqual([STARTER_KNIFE_ID])
  })
  it('légendaires uniquement en caisse', () => {
    for (const k of KNIVES.filter((k) => k.rarity === 'legendaire')) expect(k.price).toBeNull()
    for (const k of KNIVES.filter((k) => k.rarity !== 'legendaire')) expect(k.price).not.toBeNull()
  })
  it('prix croissants avec la rareté', () => {
    const maxPrice = (r: string) => Math.max(...KNIVES.filter((k) => k.rarity === r && k.price !== null).map((k) => k.price!))
    const minPrice = (r: string) => Math.min(...KNIVES.filter((k) => k.rarity === r && k.price !== null && k.price > 0).map((k) => k.price!))
    expect(maxPrice('commun')).toBeLessThan(minPrice('peu_commun'))
    expect(maxPrice('peu_commun')).toBeLessThan(minPrice('rare'))
    expect(maxPrice('rare')).toBeLessThan(minPrice('epique'))
  })
  it('stats dans les plages, raretés connues', () => {
    for (const k of KNIVES) {
      expect(k.stats.gainMult).toBeGreaterThanOrEqual(1)
      expect(k.stats.gainMult).toBeLessThanOrEqual(4.5)
      expect(k.stats.speed).toBeGreaterThanOrEqual(1)
      expect(k.stats.speed).toBeLessThanOrEqual(2)
      expect(k.stats.precision).toBeGreaterThanOrEqual(0)
      expect(k.stats.precision).toBeLessThanOrEqual(0.6)
      expect(RARITY_META[k.rarity]).toBeDefined()
    }
  })
  it('chaque rareté a au moins un couteau', () => {
    for (const r of Object.keys(RARITY_META)) expect(KNIVES.some((k) => k.rarity === r)).toBe(true)
  })
})
