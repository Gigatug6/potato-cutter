export type Rarity = 'commun' | 'peu_commun' | 'rare' | 'epique' | 'legendaire'

export const RARITY_META: Record<Rarity, { label: string; color: string; crateWeight: number; order: number; refund: number }> = {
  commun: { label: 'Commun', color: '#9ca3af', crateWeight: 50, order: 0, refund: 40 },
  peu_commun: { label: 'Peu commun', color: '#22c55e', crateWeight: 30, order: 1, refund: 250 },
  rare: { label: 'Rare', color: '#3b82f6', crateWeight: 14, order: 2, refund: 1000 },
  epique: { label: 'Épique', color: '#a855f7', crateWeight: 5, order: 3, refund: 5000 },
  legendaire: { label: 'Légendaire', color: '#f59e0b', crateWeight: 1, order: 4, refund: 12000 },
}

export const RARITIES = Object.keys(RARITY_META) as Rarity[]
