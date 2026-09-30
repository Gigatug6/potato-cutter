import type { Rng } from '../core/rng'
import type { CutModeId } from '../cutting/cutModes'
import type { Grade } from '../scoring/scoring'

export interface DishDef { id: string; label: string; emoji: string; mode: CutModeId; minGrade: Grade; multiplier: number }

export const DISHES: DishDef[] = [
  { id: 'frites', emoji: '🍟', label: 'Frites maison', mode: 'frites', minGrade: 'C', multiplier: 1.5 },
  { id: 'chips', emoji: '🥔', label: 'Chips croustillantes', mode: 'rondelles', minGrade: 'B', multiplier: 1.6 },
  { id: 'gratin', emoji: '🧀', label: 'Gratin dauphinois', mode: 'rondelles', minGrade: 'A', multiplier: 2.2 },
  { id: 'puree', emoji: '🥣', label: 'Purée rustique', mode: 'des', minGrade: 'C', multiplier: 1.4 },
  { id: 'salade', emoji: '🥗', label: 'Salade de patates', mode: 'des', minGrade: 'A', multiplier: 2.5 },
  { id: 'rosti', emoji: '🥞', label: 'Rösti parfait', mode: 'frites', minGrade: 'S', multiplier: 3 },
]

export interface Order { id: string; dishId: string; emoji?: string; mode: CutModeId; minGrade: Grade; multiplier: number; label: string }

export const ORDER_COUNT = 3
const GRADE_ORDER: Grade[] = ['S', 'A', 'B', 'C', 'D']

export const gradeAtLeast = (g: Grade, min: Grade): boolean => GRADE_ORDER.indexOf(g) <= GRADE_ORDER.indexOf(min)

export function generateOrder(rng: Rng, id: string, avoidDishIds: string[] = []): Order {
  const pool = DISHES.filter((d) => !avoidDishIds.includes(d.id))
  const d = (pool.length ? pool : DISHES)[Math.floor(rng() * (pool.length || DISHES.length))]
  return { id, dishId: d.id, emoji: d.emoji, mode: d.mode, minGrade: d.minGrade, multiplier: d.multiplier, label: d.label }
}

/** Complète la liste jusqu'à ORDER_COUNT commandes (plats distincts si possible). */
export function ensureOrders(orders: Order[], rng: Rng, now = Date.now()): Order[] {
  const out = [...orders]
  let n = 0
  while (out.length < ORDER_COUNT) out.push(generateOrder(rng, `o${now}-${n++}`, out.map((o) => o.dishId)))
  return out
}

/** Meilleure commande satisfaite par (mode, grade) — la mieux payée en premier. */
export function matchOrder(orders: Order[], mode: CutModeId, grade: Grade): Order | null {
  const ok = orders.filter((o) => o.mode === mode && gradeAtLeast(grade, o.minGrade))
  return ok.sort((a, b) => b.multiplier - a.multiplier)[0] ?? null
}

export const orderBonus = (reward: number, order: Order): number => Math.round(reward * order.multiplier)
