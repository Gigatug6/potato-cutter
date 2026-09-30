import { describe, expect, it } from 'vitest'
import { CUT_MODES } from '../cutting/cutModes'
import { idealPositions, type Bounds } from '../cutting/cutPlan'
import { applyPrecision, cutScore, gradeOf, peelScore, scoreRound, streakMultiplier } from './scoring'

const B: Bounds = { x: [-1, 1], y: [-1, 1], z: [-1, 1] }
const perfect = { x: idealPositions(-1, 1, 7), y: [], z: [] }

describe('scoring', () => {
  it('coupes parfaites → cutScore ≈ 1', () => expect(cutScore(CUT_MODES.rondelles, B, perfect)).toBeCloseTo(1))
  it('épluchage à 50 % → 0 ; 100 % → 1', () => {
    expect(peelScore(0.5)).toBe(0)
    expect(peelScore(1)).toBe(1)
  })
  it('seuils de note', () => {
    expect([0.96, 0.9, 0.75, 0.55, 0.1].map(gradeOf)).toEqual(['S', 'A', 'B', 'C', 'D'])
  })
  it('gainMult multiplie la récompense', () => {
    const base = { mode: CUT_MODES.rondelles, bounds: B, cuts: perfect, peelCoverage: 1, durationMs: 60000, streak: 0 }
    const a = scoreRound({ ...base, gainMult: 1 }).reward
    const b = scoreRound({ ...base, gainMult: 2 }).reward
    expect(b).toBeGreaterThanOrEqual(a * 2 - 1)
    expect(a).toBeGreaterThan(0)
  })
  it('streak plafonné à 5', () => expect(streakMultiplier(99)).toBeCloseTo(1.5))
  it('précision attire vers l’idéal', () => {
    expect(applyPrecision(0.1, [0], 0)).toBe(0.1)
    expect(applyPrecision(0.1, [0], 0.6)).toBeCloseTo(0.07)
  })
})
