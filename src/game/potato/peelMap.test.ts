import { describe, expect, it } from 'vitest'
import { PeelMap } from './peelMap'

describe('PeelMap', () => {
  it('couverture nulle au départ', () => expect(new PeelMap().coverage()).toBe(0))
  it('paint augmente la couverture, repeindre ne change rien', () => {
    const m = new PeelMap()
    const a = m.paint([1, 0, 0], 0.3)
    expect(a).toBeGreaterThan(0)
    const c = m.coverage()
    expect(c).toBeGreaterThan(0)
    expect(m.paint([1, 0, 0], 0.3)).toBe(0)
    expect(m.coverage()).toBe(c)
    expect(m.sample([1, 0, 0])).toBe(true)
    expect(m.sample([-1, 0, 0])).toBe(false)
  })
  it('pas de NaN aux pôles', () => {
    const m = new PeelMap()
    m.paint([0, 1, 0], 0.4)
    m.paint([0, -1, 0], 0.4)
    expect(Number.isFinite(m.coverage())).toBe(true)
    expect(m.coverage()).toBeGreaterThan(0)
  })
  it('un balayage complet atteint ~100 %', () => {
    const m = new PeelMap()
    for (let i = 0; i <= 40; i++) {
      const lat = -Math.PI / 2 + (i / 40) * Math.PI
      let prev: [number, number, number] = [Math.cos(lat), Math.sin(lat), 0]
      for (let j = 1; j <= 40; j++) {
        const lon = (j / 40) * 2 * Math.PI
        const cur: [number, number, number] = [Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)]
        m.paintStroke(prev, cur, 0.2)
        prev = cur
      }
    }
    expect(m.coverage()).toBeGreaterThan(0.999)
  })
  it('paintStroke est continu', () => {
    const m = new PeelMap()
    m.paintStroke([1, 0, 0], [0, 0, 1], 0.1)
    expect(m.sample([Math.SQRT1_2, 0, Math.SQRT1_2])).toBe(true)
  })
})
