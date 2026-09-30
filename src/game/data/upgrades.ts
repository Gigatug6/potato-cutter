export interface UpgradeDef {
  id: 'autoPeeler' | 'bigPotatoes' | 'goldenBoard'
  name: string
  description: string
  max: number
  basePrice: number
  growth: number
}

export const UPGRADES: UpgradeDef[] = [
  { id: 'autoPeeler', name: 'Éplucheur automatique', description: 'Un petit robot épluche la patate pendant que tu réfléchis.', max: 5, basePrice: 400, growth: 2.2 },
  { id: 'bigPotatoes', name: 'Grosses patates', description: 'Patates plus grosses : +5 % de taille et +20 % de valeur par niveau.', max: 5, basePrice: 600, growth: 2.4 },
  { id: 'goldenBoard', name: 'Planche dorée', description: '+10 % de gains par niveau, pour toutes les patates.', max: 5, basePrice: 500, growth: 2.5 },
]

export type UpgradeLevels = Record<string, number>

export const upgradeById = (id: string): UpgradeDef | undefined => UPGRADES.find((u) => u.id === id)

/** Prix du niveau suivant (niveau actuel = level), null si au maximum. */
export function upgradePrice(def: UpgradeDef, level: number): number | null {
  if (level >= def.max) return null
  return Math.round((def.basePrice * def.growth ** level) / 10) * 10
}

export const autoPeelSpeed = (level: number): number => level * 0.35 // rad/s de déplacement du robot
export const potatoScale = (level: number): number => 1 + 0.05 * level
export const bigPotatoValue = (level: number): number => 1 + 0.2 * level
export const goldenBoardMult = (level: number): number => 1 + 0.1 * level

export function upgradeValueMult(levels: UpgradeLevels): number {
  return bigPotatoValue(levels.bigPotatoes ?? 0) * goldenBoardMult(levels.goldenBoard ?? 0)
}
