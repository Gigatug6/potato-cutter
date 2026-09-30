import { describe, expect, it } from 'vitest'
import { CUT_MODES, totalCuts } from './cutModes'
import { CutPlan, cellsFromCuts, idealPositions, type Bounds } from './cutPlan'

const B: Bounds = { x: [-1, 1], y: [-1, 1], z: [-1, 1] }

describe('CutPlan', () => {
  it('7 coupes x → 8 cellules, passe terminée', () => {
    const p = new CutPlan(CUT_MODES.rondelles, B)
    for (const c of idealPositions(-1, 1, 7)) expect(p.addCut('x', c)).toBe('ok')
    expect(p.isComplete).toBe(true)
    expect(cellsFromCuts(B, p.cuts)).toHaveLength(8)
  })
  it('frites 4+4 → 25 cellules', () => {
    const p = new CutPlan(CUT_MODES.frites, B)
    for (const c of idealPositions(-1, 1, 4)) p.addCut('y', c)
    expect(p.currentAxis).toBe('z')
    for (const c of idealPositions(-1, 1, 4)) p.addCut('z', c)
    expect(p.isComplete).toBe(true)
    expect(cellsFromCuts(B, p.cuts)).toHaveLength(25)
  })
  it('rejette hors bornes, trop proche, mauvais axe', () => {
    const p = new CutPlan(CUT_MODES.rondelles, B)
    expect(p.addCut('x', 1.5)).toBe('out')
    expect(p.addCut('x', 0)).toBe('ok')
    expect(p.addCut('x', 0.03)).toBe('tooClose')
    expect(p.addCut('y', 0)).toBe('wrongAxis')
  })
  it('totalCuts', () => {
    expect(totalCuts(CUT_MODES.des)).toBe(13)
  })
})
