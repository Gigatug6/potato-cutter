import type { Rarity } from './rarities'

export type BladeType = 'chef' | 'santoku' | 'couperet' | 'dentele' | 'courbe' | 'double'

export interface KnifeModel {
  blade: BladeType
  bladeColor: string
  handleColor: string
  metalness: number
  roughness: number
  emissive?: string
  emissiveIntensity?: number
  glow?: boolean
  sparkles?: boolean
  lengthScale?: number
}

export interface KnifeDef {
  id: string
  name: string
  description: string
  rarity: Rarity
  /** null = uniquement en caisse */
  price: number | null
  stats: { gainMult: number; speed: number; precision: number }
  model: KnifeModel
}

export const STARTER_KNIFE_ID = 'office-rouille'
export const CRATE_PRICE = 1000

export const KNIVES: KnifeDef[] = [
  { id: 'office-rouille', name: 'Office rouillé', description: 'Le vieux couteau de mamie.', rarity: 'commun', price: 0,
    stats: { gainMult: 1, speed: 1, precision: 0 }, model: { blade: 'chef', bladeColor: '#8a8d91', handleColor: '#5b3a1e', metalness: 0.5, roughness: 0.7, lengthScale: 0.8 } },
  { id: 'eplucheur-acier', name: 'Couteau d’acier', description: 'Simple, propre, efficace.', rarity: 'commun', price: 80,
    stats: { gainMult: 1.1, speed: 1.05, precision: 0.05 }, model: { blade: 'chef', bladeColor: '#c0c4c8', handleColor: '#2b2b2b', metalness: 0.8, roughness: 0.4 } },
  { id: 'hachoir-cantine', name: 'Hachoir de cantine', description: 'Lourd mais rapide.', rarity: 'commun', price: 150,
    stats: { gainMult: 1.15, speed: 1.15, precision: 0.05 }, model: { blade: 'couperet', bladeColor: '#b0b4b8', handleColor: '#7a1f1f', metalness: 0.7, roughness: 0.5 } },
  { id: 'santoku-vert', name: 'Santoku bambou', description: 'Équilibré, manche en bambou.', rarity: 'peu_commun', price: 500,
    stats: { gainMult: 1.3, speed: 1.2, precision: 0.15 }, model: { blade: 'santoku', bladeColor: '#d4d8dc', handleColor: '#3f8f3f', metalness: 0.85, roughness: 0.3 } },
  { id: 'dentele-boulanger', name: 'Dentelé du boulanger', description: 'Mord dans la peau.', rarity: 'peu_commun', price: 650,
    stats: { gainMult: 1.35, speed: 1.3, precision: 0.1 }, model: { blade: 'dentele', bladeColor: '#dde1e5', handleColor: '#2f7a3a', metalness: 0.85, roughness: 0.3 } },
  { id: 'courbe-gaucho', name: 'Courbe du gaucho', description: 'Une lame qui a voyagé.', rarity: 'peu_commun', price: 800,
    stats: { gainMult: 1.4, speed: 1.25, precision: 0.2 }, model: { blade: 'courbe', bladeColor: '#cfd4d9', handleColor: '#2e6b34', metalness: 0.9, roughness: 0.25 } },
  { id: 'chef-azur', name: 'Chef Azur', description: 'Acier bleuté trempé à la glace.', rarity: 'rare', price: 2000,
    stats: { gainMult: 1.7, speed: 1.5, precision: 0.3 }, model: { blade: 'chef', bladeColor: '#5d8fd6', handleColor: '#1d3b73', metalness: 1, roughness: 0.15 } },
  { id: 'double-saphir', name: 'Double saphir', description: 'Deux lames, deux fois plus de gloire.', rarity: 'rare', price: 3500,
    stats: { gainMult: 1.9, speed: 1.5, precision: 0.35 }, model: { blade: 'double', bladeColor: '#4f7fd0', handleColor: '#173060', metalness: 1, roughness: 0.15, lengthScale: 1.1 } },
  { id: 'santoku-amethyste', name: 'Santoku améthyste', description: 'Vibre doucement dans la nuit.', rarity: 'epique', price: 10000,
    stats: { gainMult: 2.2, speed: 1.7, precision: 0.45 }, model: { blade: 'santoku', bladeColor: '#9b59d6', handleColor: '#3a1a5c', metalness: 0.9, roughness: 0.2, emissive: '#a855f7', emissiveIntensity: 0.6, glow: true } },
  { id: 'couperet-ombre', name: 'Couperet des ombres', description: 'Tranche même les légumes du dimanche.', rarity: 'epique', price: 15000,
    stats: { gainMult: 2.5, speed: 1.8, precision: 0.45 }, model: { blade: 'couperet', bladeColor: '#6d2fb0', handleColor: '#1f0f33', metalness: 0.9, roughness: 0.2, emissive: '#8b3fe0', emissiveIntensity: 0.7, glow: true } },
  { id: 'excalipatate', name: 'Excalipatate', description: 'Celui qui le tire de la patate sera roi.', rarity: 'legendaire', price: null,
    stats: { gainMult: 3.5, speed: 2, precision: 0.55 }, model: { blade: 'chef', bladeColor: '#ffd36a', handleColor: '#8a5a00', metalness: 1, roughness: 0.1, emissive: '#ffb300', emissiveIntensity: 1, glow: true, sparkles: true, lengthScale: 1.25 } },
  { id: 'tranche-soleil', name: 'Tranche-soleil', description: 'Forgé dans le cœur d’une étoile frite.', rarity: 'legendaire', price: null,
    stats: { gainMult: 4, speed: 2, precision: 0.6 }, model: { blade: 'courbe', bladeColor: '#fff0a0', handleColor: '#b07400', metalness: 1, roughness: 0.1, emissive: '#ffd000', emissiveIntensity: 1.2, glow: true, sparkles: true, lengthScale: 1.2 } },
]

export const knifeById = (id: string): KnifeDef | undefined => KNIVES.find((k) => k.id === id)
