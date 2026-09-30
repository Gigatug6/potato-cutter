import type { Rng } from '../core/rng'
import { KNIVES } from '../data/knives'
import { RARITIES, RARITY_META, type Rarity } from '../data/rarities'

export interface CrateResult { knifeId: string; rarity: Rarity; duplicate: boolean; refund: number }

export function rollRarity(rng: Rng): Rarity {
  const total = RARITIES.reduce((s, r) => s + RARITY_META[r].crateWeight, 0)
  let x = rng() * total
  for (const r of RARITIES) {
    x -= RARITY_META[r].crateWeight
    if (x < 0) return r
  }
  return 'commun'
}

/** Tire un couteau. `owned` : ids déjà possédés. Un doublon rembourse `refund` de sa rareté. */
export function openCrate(rng: Rng, owned: ReadonlySet<string>): CrateResult {
  const rarity = rollRarity(rng)
  const pool = KNIVES.filter((k) => k.rarity === rarity && k.price !== 0)
  const knife = pool[Math.floor(rng() * pool.length)]
  const duplicate = owned.has(knife.id)
  return { knifeId: knife.id, rarity, duplicate, refund: duplicate ? RARITY_META[rarity].refund : 0 }
}
