import { describe, expect, it } from 'vitest'
import { createPotatoShape, extentAlong, isInside, radiusAt, type Vec3 } from './potatoShape'

describe('potatoShape', () => {
  const s = createPotatoShape(7)
  it("l'origine est dedans, un point lointain dehors", () => {
    expect(isInside(s, [0, 0, 0])).toBe(true)
    expect(isInside(s, [5, 0, 0])).toBe(false)
  })
  it('radiusAt reste dans [0.6, 1.6]', () => {
    for (let i = 0; i < 200; i++) {
      const t = i * 0.37, p = i * 0.91
      const d: Vec3 = [Math.sin(t) * Math.cos(p), Math.cos(t), Math.sin(t) * Math.sin(p)]
      const r = radiusAt(s, d)
      expect(r).toBeGreaterThan(0.6)
      expect(r).toBeLessThan(1.6)
    }
  })
  it('même graine → même forme', () => {
    expect(createPotatoShape(7)).toEqual(s)
    expect(createPotatoShape(8)).not.toEqual(s)
  })
  it('extentAlong est cohérent avec isInside', () => {
    const [min, max] = extentAlong(s, 'x')
    expect(min).toBeLessThan(-0.9)
    expect(max).toBeGreaterThan(0.9)
    expect(isInside(s, [max + 0.05, 0, 0])).toBe(false)
    expect(isInside(s, [min * 0.5, 0, 0])).toBe(true)
  })
})
