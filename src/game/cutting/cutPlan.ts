import type { Axis } from '../potato/potatoShape'
import type { CutModeDef } from './cutModes'

export const MIN_CUT_GAP = 0.08

export type Bounds = Record<Axis, [number, number]>
export type Cuts = Record<Axis, number[]>
export interface Cell { min: [number, number, number]; max: [number, number, number]; index: [number, number, number] }

export type AddCutResult = 'ok' | 'out' | 'tooClose' | 'passFull' | 'wrongAxis'

export class CutPlan {
  readonly cuts: Cuts = { x: [], y: [], z: [] }
  passIndex = 0

  constructor(readonly mode: CutModeDef, readonly bounds: Bounds) {}

  get currentAxis(): Axis | null {
    return this.mode.passes[this.passIndex]?.axis ?? null
  }

  get isComplete(): boolean {
    return this.passIndex >= this.mode.passes.length
  }

  get cutCount(): number {
    return this.cuts.x.length + this.cuts.y.length + this.cuts.z.length
  }

  /** Ajoute une coupe sur l'axe de la passe courante. Passe automatiquement à la suivante quand elle est pleine. */
  addCut(axis: Axis, pos: number): AddCutResult {
    const pass = this.mode.passes[this.passIndex]
    if (!pass) return 'passFull'
    if (pass.axis !== axis) return 'wrongAxis'
    const [min, max] = this.bounds[axis]
    if (pos <= min + MIN_CUT_GAP / 2 || pos >= max - MIN_CUT_GAP / 2) return 'out'
    if (this.cuts[axis].some((c) => Math.abs(c - pos) < MIN_CUT_GAP)) return 'tooClose'
    this.cuts[axis].push(pos)
    this.cuts[axis].sort((a, b) => a - b)
    if (this.cuts[axis].length >= pass.cuts) this.passIndex++
    return 'ok'
  }

  nextPass(): void {
    if (this.passIndex < this.mode.passes.length) this.passIndex++
  }
}

export function cellsFromCuts(bounds: Bounds, cuts: Cuts): Cell[] {
  const edges = (a: Axis): number[] => [bounds[a][0], ...cuts[a], bounds[a][1]]
  const ex = edges('x'), ey = edges('y'), ez = edges('z')
  const out: Cell[] = []
  for (let i = 0; i < ex.length - 1; i++)
    for (let j = 0; j < ey.length - 1; j++)
      for (let k = 0; k < ez.length - 1; k++)
        out.push({ min: [ex[i], ey[j], ez[k]], max: [ex[i + 1], ey[j + 1], ez[k + 1]], index: [i, j, k] })
  return out
}

/** Positions idéales (équidistantes) pour n coupes sur [min,max]. */
export function idealPositions(min: number, max: number, n: number): number[] {
  return Array.from({ length: n }, (_, i) => min + ((max - min) * (i + 1)) / (n + 1))
}
