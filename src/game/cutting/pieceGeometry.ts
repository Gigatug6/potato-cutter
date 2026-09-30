import { BoxGeometry, BufferAttribute, type BufferGeometry } from 'three'
import type { PeelMap } from '../potato/peelMap'
import { isInside, type PotatoShape, type Vec3 } from '../potato/potatoShape'
import type { Cell } from './cutPlan'

// valeurs linéaires (three interprète les couleurs de sommets en linéaire) : ~ sRGB (232,204,125) et (117,89,56)
export const FLESH: Vec3 = [0.72, 0.60, 0.30]
export const SKIN: Vec3 = [0.18, 0.10, 0.04]
const STEP = 0.06
const SAMPLES = 5

export interface Piece {
  geometry: BufferGeometry
  /** centre de la cellule (pour l'écartement) */
  center: Vec3
  volume: number
}

/** Construit la pièce « cellule ∩ patate » par rétraction des sommets sortants. Renvoie null pour une miette. */
export function buildPieceGeometry(cell: Cell, shape: PotatoShape, peel: PeelMap): Piece | null {
  const size: Vec3 = [cell.max[0] - cell.min[0], cell.max[1] - cell.min[1], cell.max[2] - cell.min[2]]
  const center: Vec3 = [cell.min[0] + size[0] / 2, cell.min[1] + size[1] / 2, cell.min[2] + size[2] / 2]

  // échantillonnage intérieur
  let inside = 0
  const q: Vec3 = [0, 0, 0]
  for (let i = 0; i < SAMPLES; i++)
    for (let j = 0; j < SAMPLES; j++)
      for (let k = 0; k < SAMPLES; k++) {
        const p: Vec3 = [
          cell.min[0] + (size[0] * (i + 0.5)) / SAMPLES,
          cell.min[1] + (size[1] * (j + 0.5)) / SAMPLES,
          cell.min[2] + (size[2] * (k + 0.5)) / SAMPLES,
        ]
        if (isInside(shape, p)) { inside++; q[0] += p[0]; q[1] += p[1]; q[2] += p[2] }
      }
  const total = SAMPLES ** 3
  const volume = size[0] * size[1] * size[2] * (inside / total)
  if (inside < 2 || volume < 0.002) return null
  q[0] /= inside; q[1] /= inside; q[2] /= inside

  const seg = (s: number) => Math.max(1, Math.ceil(s / STEP))
  const g = new BoxGeometry(size[0], size[1], size[2], seg(size[0]), seg(size[1]), seg(size[2]))
  const pos = g.getAttribute('position') as BufferAttribute
  const col = new Float32Array(pos.count * 3)

  for (let v = 0; v < pos.count; v++) {
    const p: Vec3 = [pos.getX(v) + center[0], pos.getY(v) + center[1], pos.getZ(v) + center[2]]
    let outer = false
    if (!isInside(shape, p)) {
      // bisection sur le segment q → p
      let lo = 0, hi = 1
      for (let it = 0; it < 12; it++) {
        const mid = (lo + hi) / 2
        const m: Vec3 = [q[0] + (p[0] - q[0]) * mid, q[1] + (p[1] - q[1]) * mid, q[2] + (p[2] - q[2]) * mid]
        if (isInside(shape, m)) lo = mid
        else hi = mid
      }
      p[0] = q[0] + (p[0] - q[0]) * lo
      p[1] = q[1] + (p[1] - q[1]) * lo
      p[2] = q[2] + (p[2] - q[2]) * lo
      outer = true
    }
    // position relative au centre de la cellule (le mesh est placé au centre)
    pos.setXYZ(v, p[0] - center[0], p[1] - center[1], p[2] - center[2])
    let c = FLESH
    if (outer) {
      const l = Math.hypot(p[0], p[1], p[2]) || 1
      c = peel.sample([p[0] / l, p[1] / l, p[2] / l]) ? FLESH : SKIN
    }
    col[v * 3] = c[0]; col[v * 3 + 1] = c[1]; col[v * 3 + 2] = c[2]
  }
  g.setAttribute('color', new BufferAttribute(col, 3))
  g.computeVertexNormals()
  g.computeBoundingSphere()
  return { geometry: g, center, volume }
}
