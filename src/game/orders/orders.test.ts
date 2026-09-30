import { describe, expect, it } from 'vitest'
import { createRng } from '../core/rng'
import { ORDER_COUNT, ensureOrders, gradeAtLeast, matchOrder, orderBonus, type Order } from './orders'

describe('orders', () => {
  it('gradeAtLeast', () => {
    expect(gradeAtLeast('S', 'A')).toBe(true)
    expect(gradeAtLeast('B', 'A')).toBe(false)
    expect(gradeAtLeast('C', 'C')).toBe(true)
  })
  it('ensureOrders remplit à 3 plats distincts', () => {
    const o = ensureOrders([], createRng(1), 1000)
    expect(o).toHaveLength(ORDER_COUNT)
    expect(new Set(o.map((x) => x.dishId)).size).toBe(ORDER_COUNT)
    expect(ensureOrders(o, createRng(2))).toEqual(o)
  })
  it('matchOrder prend la mieux payée satisfaite ; bonus', () => {
    const base = { id: 'x', dishId: 'd', label: 'l' }
    const orders: Order[] = [
      { ...base, id: '1', mode: 'frites', minGrade: 'C', multiplier: 1.5 },
      { ...base, id: '2', mode: 'frites', minGrade: 'S', multiplier: 3 },
      { ...base, id: '3', mode: 'des', minGrade: 'C', multiplier: 1.4 },
    ]
    expect(matchOrder(orders, 'frites', 'A')!.id).toBe('1')
    expect(matchOrder(orders, 'frites', 'S')!.id).toBe('2')
    expect(matchOrder(orders, 'rondelles', 'S')).toBeNull()
    expect(matchOrder(orders, 'frites', 'D')).toBeNull()
    expect(orderBonus(100, orders[0])).toBe(150)
  })
})
