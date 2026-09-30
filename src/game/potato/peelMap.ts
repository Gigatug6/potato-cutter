import type { Vec3 } from './potatoShape'

export const PEEL_W = 128
export const PEEL_H = 64

/** Direction (unitaire) → indices de cellule (longitude, latitude). */
export function dirToCell(d: Vec3): [number, number] {
  const lon = Math.atan2(d[2], d[0]) // [-π, π]
  const lat = Math.asin(Math.max(-1, Math.min(1, d[1]))) // [-π/2, π/2]
  const x = Math.min(PEEL_W - 1, Math.floor(((lon + Math.PI) / (2 * Math.PI)) * PEEL_W))
  const y = Math.min(PEEL_H - 1, Math.floor(((lat + Math.PI / 2) / Math.PI) * PEEL_H))
  return [x, y]
}

function cellDir(x: number, y: number): Vec3 {
  const lon = ((x + 0.5) / PEEL_W) * 2 * Math.PI - Math.PI
  const lat = ((y + 0.5) / PEEL_H) * Math.PI - Math.PI / 2
  return [Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)]
}

export class PeelMap {
  readonly cells = new Uint8Array(PEEL_W * PEEL_H)
  private readonly weights = new Float32Array(PEEL_H)
  private readonly totalWeight: number
  private peeledWeight = 0

  constructor() {
    let t = 0
    for (let y = 0; y < PEEL_H; y++) {
      const lat = ((y + 0.5) / PEEL_H) * Math.PI - Math.PI / 2
      this.weights[y] = Math.cos(lat)
      t += this.weights[y] * PEEL_W
    }
    this.totalWeight = t
  }

  /** Épluche les cellules à moins de `radius` (rad) de dir. Renvoie l'aire (pondérée) nouvellement pelée. */
  paint(dir: Vec3, radius: number): number {
    const [cx, cy] = dirToCell(dir)
    const dyCells = Math.ceil(((radius / Math.PI) * PEEL_H)) + 1
    const cosLat = Math.max(0.05, Math.sqrt(Math.max(0, 1 - dir[1] * dir[1])))
    const dxCells = Math.min(PEEL_W / 2, Math.ceil((radius / (2 * Math.PI)) * PEEL_W / cosLat) + 1)
    const cosR = Math.cos(radius)
    let added = 0
    for (let dy = -dyCells; dy <= dyCells; dy++) {
      const y = cy + dy
      if (y < 0 || y >= PEEL_H) continue
      for (let dx = -dxCells; dx <= dxCells; dx++) {
        const x = (((cx + dx) % PEEL_W) + PEEL_W) % PEEL_W
        const i = y * PEEL_W + x
        if (this.cells[i]) continue
        const c = cellDir(x, y)
        if (c[0] * dir[0] + c[1] * dir[1] + c[2] * dir[2] >= cosR) {
          this.cells[i] = 1
          added += this.weights[y]
        }
      }
    }
    this.peeledWeight += added
    return added
  }

  /** Épluche le long du grand cercle entre deux directions (pas de radius/2). */
  paintStroke(from: Vec3, to: Vec3, radius: number): number {
    const dot = Math.max(-1, Math.min(1, from[0] * to[0] + from[1] * to[1] + from[2] * to[2]))
    const angle = Math.acos(dot)
    const steps = Math.max(1, Math.ceil(angle / (radius / 2)))
    let added = 0
    for (let s = 0; s <= steps; s++) {
      const t = s / steps
      let v: Vec3
      if (angle < 1e-6) v = to
      else {
        const a = Math.sin((1 - t) * angle) / Math.sin(angle)
        const b = Math.sin(t * angle) / Math.sin(angle)
        v = [a * from[0] + b * to[0], a * from[1] + b * to[1], a * from[2] + b * to[2]]
      }
      const l = Math.hypot(v[0], v[1], v[2]) || 1
      added += this.paint([v[0] / l, v[1] / l, v[2] / l], radius)
    }
    return added
  }

  coverage(): number {
    return this.peeledWeight / this.totalWeight
  }

  sample(dir: Vec3): boolean {
    const [x, y] = dirToCell(dir)
    return this.cells[y * PEEL_W + x] === 1
  }
}
