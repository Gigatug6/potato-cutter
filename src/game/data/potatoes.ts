import type { Vec3 } from '../potato/potatoShape'

export type BadKind = 'green' | 'rotten'

export interface PotatoKind {
  id: string
  name: string
  description: string
  /** multiplicateur sur la récompense */
  valueMult: number
  /** null = non achetable (n'existe pas) ; 0 = débloquée d'office */
  price: number
  /** multiplicateurs sur les rayons de la forme */
  radiiMult: Vec3
  /** teinte de la texture de peau (shader) */
  skinTint: Vec3
  /** couleur linéaire de la chair */
  flesh: Vec3
  /** couleur linéaire de la peau restante sur les pièces */
  skinPiece: Vec3
}

export const POTATOES: PotatoKind[] = [
  { id: 'bintje', name: 'Bintje', description: 'La patate classique.', valueMult: 1, price: 0,
    radiiMult: [1, 1, 1], skinTint: [2.5, 1.85, 1.05], flesh: [0.8, 0.62, 0.2], skinPiece: [0.18, 0.1, 0.04] },
  { id: 'ratte', name: 'Ratte', description: 'Fine et allongée, chair jaune et fondante.', valueMult: 1.35, price: 300,
    radiiMult: [1.15, 0.72, 0.72], skinTint: [2.7, 2.1, 1.3], flesh: [0.75, 0.62, 0.28], skinPiece: [0.2, 0.12, 0.05] },
  { id: 'rouge', name: 'Désirée', description: 'Peau rouge, chair crème.', valueMult: 1.7, price: 900,
    radiiMult: [1.05, 0.95, 0.9], skinTint: [3.2, 1.2, 0.9], flesh: [0.75, 0.68, 0.45], skinPiece: [0.3, 0.06, 0.04] },
  { id: 'violette', name: 'Vitelotte', description: 'Violette de part en part.', valueMult: 2.4, price: 2500,
    radiiMult: [1.1, 0.8, 0.8], skinTint: [0.55, 0.32, 0.95], flesh: [0.35, 0.12, 0.45], skinPiece: [0.08, 0.04, 0.14] },
  { id: 'douce', name: 'Patate douce', description: 'Chair orange, très sucrée.', valueMult: 3.2, price: 6000,
    radiiMult: [1.05, 0.9, 0.9], skinTint: [3.2, 1.6, 0.9], flesh: [0.85, 0.35, 0.06], skinPiece: [0.4, 0.12, 0.05] },
  { id: 'doree', name: 'Patate dorée', description: 'Une légende des potagers.', valueMult: 5, price: 15000,
    radiiMult: [1.1, 1, 0.95], skinTint: [3.5, 2.8, 0.8], flesh: [0.95, 0.72, 0.12], skinPiece: [0.5, 0.3, 0.03] },
]

export const STARTER_POTATO_ID = 'bintje'
export const potatoById = (id: string): PotatoKind | undefined => POTATOES.find((p) => p.id === id)

/** Apparence d'une patate abîmée (remplace teinte/chair). */
export const BAD_LOOKS: Record<BadKind, { skinTint: Vec3; flesh: Vec3; skinPiece: Vec3; label: string }> = {
  green: { skinTint: [1.0, 2.4, 0.9], flesh: [0.4, 0.6, 0.15], skinPiece: [0.06, 0.2, 0.04], label: 'Patate verte (toxique)' },
  rotten: { skinTint: [0.9, 0.75, 0.55], flesh: [0.25, 0.18, 0.08], skinPiece: [0.05, 0.03, 0.02], label: 'Patate pourrie' },
}

export const BAD_CHANCE = 0.12
export const BAD_REWARD_MULT = 0.1

/** Déterministe : une graine donne toujours la même « mauvaise » patate (ou aucune). */
export function badKindForSeed(seed: number): BadKind | null {
  let x = (seed ^ 0x5bd1e995) >>> 0
  x = Math.imul(x ^ (x >>> 15), 0x2c1b3c6d) >>> 0
  x = Math.imul(x ^ (x >>> 12), 0x297a2d39) >>> 0
  const r = ((x ^ (x >>> 15)) >>> 0) / 4294967296
  if (r >= BAD_CHANCE) return null
  return r < BAD_CHANCE / 2 ? 'green' : 'rotten'
}
