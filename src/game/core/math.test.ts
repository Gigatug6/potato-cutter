import { describe, expect, it } from 'vitest'
import { clamp, lerp, smoothstep } from './math'

describe('math', () => {
  it('clamp borne la valeur', () => {
    expect(clamp(5, 0, 1)).toBe(1)
    expect(clamp(-5, 0, 1)).toBe(0)
  })
  it('lerp interpole', () => expect(lerp(0, 10, 0.5)).toBe(5))
  it('smoothstep est borné', () => {
    expect(smoothstep(0, 1, -1)).toBe(0)
    expect(smoothstep(0, 1, 2)).toBe(1)
    expect(smoothstep(0, 1, 0.5)).toBe(0.5)
  })
})
