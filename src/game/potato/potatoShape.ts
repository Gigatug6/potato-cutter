import { createRng } from '../core/rng'

export type Vec3 = [number, number, number]
export type Axis = 'x' | 'y' | 'z'

export interface PotatoShape {
  seed: number
  radii: Vec3
  noiseAmp: number
  /** 5 termes : fréquences (k) et phases */
  terms: { k: Vec3; phase: number }[]
}

export function createPotatoShape(seed: number, radiiMult: Vec3 = [1, 1, 1], scale = 1): PotatoShape {
  const rng = createRng(seed)
  const radii: Vec3 = [
    (1.25 + rng() * 0.15) * radiiMult[0] * scale,
    (0.85 + rng() * 0.1) * radiiMult[1] * scale,
    (0.75 + rng() * 0.1) * radiiMult[2] * scale,
  ]
  const terms = Array.from({ length: 5 }, () => ({
    k: [1 + rng() * 3, 1 + rng() * 3, 1 + rng() * 3] as Vec3,
    phase: rng() * Math.PI * 2,
  }))
  return { seed, radii, noiseAmp: 0.04, terms }
}

/** Rayon de la surface dans la direction (unitaire) dir. */
export function radiusAt(shape: PotatoShape, dir: Vec3): number {
  const [dx, dy, dz] = dir
  const [a, b, c] = shape.radii
  const ell = 1 / Math.sqrt((dx / a) ** 2 + (dy / b) ** 2 + (dz / c) ** 2)
  let n = 0
  for (const t of shape.terms) n += Math.sin(t.k[0] * dx + t.k[1] * dy + t.k[2] * dz + t.phase)
  return ell * (1 + (shape.noiseAmp * n) / shape.terms.length)
}

export function isInside(shape: PotatoShape, p: Vec3): boolean {
  const len = Math.hypot(p[0], p[1], p[2])
  if (len < 1e-9) return true
  return len <= radiusAt(shape, [p[0] / len, p[1] / len, p[2] / len])
}


/** Étendue [min,max] le long d'un axe (par échantillonnage de la surface). */
export function extentAlong(shape: PotatoShape, axis: Axis): [number, number] {
  const i = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
  let min = Infinity, max = -Infinity
  const N = 48
  for (let u = 0; u <= N; u++) {
    const theta = (u / N) * Math.PI
    for (let v = 0; v < N * 2; v++) {
      const phi = (v / (N * 2)) * Math.PI * 2
      const d: Vec3 = [Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi)]
      const r = radiusAt(shape, d)
      const val = d[i] * r
      if (val < min) min = val
      if (val > max) max = val
    }
  }
  return [min, max]
}
