import type { Rarity } from './rarities'

export type DecorCategory = 'board' | 'wall' | 'mood' | 'prop'
export type PropKind = 'plant' | 'plates' | 'spices' | 'candles' | 'lamp'

export interface BoardStyle { tex: string | null; repeat: [number, number]; tint: [number, number, number]; roughness: number; clearcoat: number }
export interface WallStyle { tex: string; repeat: [number, number]; tint: [number, number, number]; roughness: number }
export interface MoodStyle {
  hdri: string
  /** multiplicateur global d'éclairage (exposition) */
  exposure: number
  sun: { color: string; intensity: number; pos: [number, number, number] }
  hemi: number
  env: number
  bloom: number
  bg: string
  neon?: string
}

export interface DecorDef {
  id: string
  name: string
  description: string
  category: DecorCategory
  price: number
  rarity: Rarity
  board?: BoardStyle
  wall?: WallStyle
  mood?: MoodStyle
  prop?: PropKind
}

export const DEFAULT_DECOR = ['board-wood', 'wall-plaster', 'mood-studio']

export const DECOR: DecorDef[] = [
  // ---- planches
  { id: 'board-wood', name: 'Planche en bois', description: 'La planche de toujours.', category: 'board', price: 0, rarity: 'commun',
    board: { tex: null, repeat: [2, 1.3], tint: [1.6, 1.5, 1.4], roughness: 0.75, clearcoat: 0.25 } },
  { id: 'board-darkwood', name: 'Noyer sombre', description: 'Bois foncé ciré.', category: 'board', price: 600, rarity: 'peu_commun',
    board: { tex: 'dark_wood', repeat: [2, 1.3], tint: [1.6, 1.6, 1.6], roughness: 0.55, clearcoat: 0.5 } },
  { id: 'board-marble', name: 'Marbre', description: 'Plan de travail de chef pâtissier.', category: 'board', price: 1500, rarity: 'rare',
    board: { tex: 'marble_01', repeat: [1.2, 0.8], tint: [1.25, 1.25, 1.25], roughness: 0.18, clearcoat: 1 } },
  { id: 'board-slate', name: 'Ardoise', description: 'Pierre noire, ambiance bistrot.', category: 'board', price: 2500, rarity: 'epique',
    board: { tex: 'slate_floor', repeat: [2, 1.3], tint: [1.9, 1.9, 1.9], roughness: 0.35, clearcoat: 0.6 } },
  { id: 'board-parquet', name: 'Parquet à chevrons', description: 'Le luxe à la française.', category: 'board', price: 4000, rarity: 'legendaire',
    board: { tex: 'herringbone_parquet', repeat: [1.6, 1], tint: [1.7, 1.6, 1.5], roughness: 0.4, clearcoat: 0.7 } },
  // ---- murs
  { id: 'wall-plaster', name: 'Crépi beige', description: 'Sobre et chaleureux.', category: 'wall', price: 0, rarity: 'commun',
    wall: { tex: 'plastered_wall_04', repeat: [5, 2], tint: [1.4, 1.3, 1.15], roughness: 0.95 } },
  { id: 'wall-brick', name: 'Briques rouges', description: 'Un loft de chef.', category: 'wall', price: 500, rarity: 'peu_commun',
    wall: { tex: 'red_brick', repeat: [6, 2.4], tint: [1.4, 1.3, 1.25], roughness: 0.9 } },
  { id: 'wall-concrete', name: 'Béton brut', description: 'Industriel et minimal.', category: 'wall', price: 1200, rarity: 'rare',
    wall: { tex: 'concrete_wall_008', repeat: [4, 1.6], tint: [1.5, 1.5, 1.5], roughness: 0.85 } },
  // ---- ambiances (éclairage + HDRI)
  { id: 'mood-studio', name: 'Studio', description: 'Lumière douce de studio photo.', category: 'mood', price: 0, rarity: 'commun',
    mood: { hdri: 'studio_small_09', exposure: 1, sun: { color: '#fffbe8', intensity: 1.6, pos: [3, 7, 4] }, hemi: 0.35, env: 0.9, bloom: 0.35, bg: '#cdb48f' } },
  { id: 'mood-day', name: 'Plein jour', description: 'Soleil par la fenêtre.', category: 'mood', price: 700, rarity: 'peu_commun',
    mood: { hdri: 'kloofendal_48d_partly_cloudy_puresky', exposure: 1.05, sun: { color: '#fff2d0', intensity: 2.6, pos: [5, 8, 3] }, hemi: 0.3, env: 1, bloom: 0.3, bg: '#bcd2e8' } },
  { id: 'mood-sunset', name: 'Coucher de soleil', description: 'Lumière orange rasante, ombres longues.', category: 'mood', price: 1800, rarity: 'rare',
    mood: { hdri: 'venice_sunset', exposure: 1, sun: { color: '#ff9a4d', intensity: 2.4, pos: [-6, 3.2, 3.5] }, hemi: 0.25, env: 0.9, bloom: 0.6, bg: '#e7a06a' } },
  { id: 'mood-night', name: 'Nuit néon', description: 'Clair de lune et néons, bloom à fond.', category: 'mood', price: 3000, rarity: 'epique',
    mood: { hdri: 'moonlit_golf', exposure: 1.15, sun: { color: '#7fa0ff', intensity: 0.7, pos: [-3, 6, 3] }, hemi: 0.15, env: 0.55, bloom: 1.0, bg: '#0c1330', neon: '#ff3fa4' } },
  // ---- objets
  { id: 'prop-plant', name: 'Plante en pot', description: 'Un brin de verdure.', category: 'prop', price: 400, rarity: 'commun', prop: 'plant' },
  { id: 'prop-spices', name: 'Bocaux d’épices', description: 'Paprika, curry, sel.', category: 'prop', price: 500, rarity: 'commun', prop: 'spices' },
  { id: 'prop-plates', name: 'Pile d’assiettes', description: 'Prêtes pour le service.', category: 'prop', price: 600, rarity: 'peu_commun', prop: 'plates' },
  { id: 'prop-candles', name: 'Bougies', description: 'Flammes vacillantes.', category: 'prop', price: 900, rarity: 'rare', prop: 'candles' },
  { id: 'prop-lamp', name: 'Suspension', description: 'Lampe de restaurant étoilé.', category: 'prop', price: 1200, rarity: 'rare', prop: 'lamp' },
]

export const decorById = (id: string): DecorDef | undefined => DECOR.find((d) => d.id === id)
export const DECOR_CATEGORIES: { id: DecorCategory; label: string }[] = [
  { id: 'board', label: 'Planches' }, { id: 'wall', label: 'Murs' }, { id: 'mood', label: 'Ambiances' }, { id: 'prop', label: 'Objets' },
]

/** Un seul décor par catégorie (planche, mur, ambiance) ; les objets s'allument/éteignent. */
export function toggleEquip(equipped: string[], id: string): string[] {
  const def = decorById(id)
  if (!def) return equipped
  if (def.category === 'prop') return equipped.includes(id) ? equipped.filter((x) => x !== id) : [...equipped, id]
  return [...equipped.filter((x) => decorById(x)?.category !== def.category), id]
}

/** Répare une liste « équipé » : ne garde que des décors possédés, un seul par catégorie, avec les défauts. */
export function sanitizeEquipped(equipped: unknown, owned: string[]): string[] {
  const list = Array.isArray(equipped) ? equipped.filter((x): x is string => typeof x === 'string' && owned.includes(x) && !!decorById(x)) : []
  let out: string[] = []
  for (const id of list) out = out.includes(id) ? out : toggleEquip(out, id)
  for (const d of DEFAULT_DECOR) {
    const cat = decorById(d)!.category
    if (!out.some((x) => decorById(x)?.category === cat)) out.push(d)
  }
  return out
}
