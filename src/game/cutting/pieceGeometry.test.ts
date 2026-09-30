import { describe, expect, it } from 'vitest'
import { PeelMap } from '../potato/peelMap'
import { createPotatoShape, extentAlong, radiusAt, type Axis, type Vec3 } from '../potato/potatoShape'
import { CUT_MODES } from './cutModes'
import { CutPlan, cellsFromCuts, idealPositions, type Bounds } from './cutPlan'
import { buildPieceGeometry } from './pieceGeometry'

const shape = createPotatoShape(3)
const peel = new PeelMap()
const axes: Axis[] = ['x', 'y', 'z']
const bounds = Object.fromEntries(axes.map((a) => [a, extentAlong(shape, a)])) as Bounds

function fullDice() {
  const plan = new CutPlan(CUT_MODES.des, bounds)
  for (const p of CUT_MODES.des.passes) for (const c of idealPositions(...bounds[p.axis], p.cuts)) plan.addCut(p.axis, c)
  return cellsFromCuts(bounds, plan.cuts)
}

describe('pieceGeometry', () => {
  it('cellule hors patate → null', () => {
    const c = { min: [5, 5, 5] as Vec3, max: [6, 6, 6] as Vec3, index: [0, 0, 0] as Vec3 }
    expect(buildPieceGeometry(c, shape, peel)).toBeNull()
  })
  it('sommets dans la cellule et sur/dans la patate, sans NaN', () => {
    const t0 = performance.now()
    const cells = fullDice()
    let count = 0, volume = 0
    for (const cell of cells) {
      const piece = buildPieceGeometry(cell, shape, peel)
      if (!piece) continue
      count++; volume += piece.volume
      const pos = piece.geometry.getAttribute('position')
      for (let v = 0; v < pos.count; v++) {
        const p: Vec3 = [pos.getX(v) + piece.center[0], pos.getY(v) + piece.center[1], pos.getZ(v) + piece.center[2]]
        expect(p.every(Number.isFinite)).toBe(true)
        for (let a = 0; a < 3; a++) {
          expect(p[a]).toBeGreaterThanOrEqual(cell.min[a] - 1e-4)
          expect(p[a]).toBeLessThanOrEqual(cell.max[a] + 1e-4)
        }
        const l = Math.hypot(...p)
        expect(l).toBeLessThanOrEqual(radiusAt(shape, [p[0] / l, p[1] / l, p[2] / l]) + 1e-3)
      }
    }
    expect(count).toBeGreaterThan(20)
    expect(performance.now() - t0).toBeLessThan(2000)
    // volume ≈ volume d'un ellipsoïde ~ 4/3 π abc (±25 %, bruit inclus)
    const [a, b, c] = shape.radii
    const ref = (4 / 3) * Math.PI * a * b * c
    expect(volume / ref).toBeGreaterThan(0.75)
    expect(volume / ref).toBeLessThan(1.25)
  })
})
