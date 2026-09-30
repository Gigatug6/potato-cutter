import { clamp, smoothstep } from '../core/math'
import type { CutModeDef } from '../cutting/cutModes'
import { idealPositions, type Bounds, type Cuts } from '../cutting/cutPlan'

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D'

export interface RoundResult {
  peelScore: number; cutScore: number; completion: number; speedBonus: number
  quality: number; grade: Grade; reward: number; durationMs: number
}

export const peelScore = (coverage: number): number => smoothstep(0.6, 0.97, coverage)

export function cutScore(mode: CutModeDef, bounds: Bounds, cuts: Cuts): number {
  let sum = 0
  for (const pass of mode.passes) {
    const [min, max] = bounds[pass.axis]
    const ideal = idealPositions(min, max, pass.cuts)
    const spacing = (max - min) / (pass.cuts + 1)
    const done = cuts[pass.axis]
    if (done.length === 0) continue
    const err = done.reduce((s, c) => s + Math.min(...ideal.map((i) => Math.abs(i - c))), 0) / done.length
    sum += clamp(1 - err / (spacing / 2), 0, 1)
  }
  return sum / mode.passes.length
}

export function gradeOf(q: number): Grade {
  return q >= 0.95 ? 'S' : q >= 0.85 ? 'A' : q >= 0.7 ? 'B' : q >= 0.5 ? 'C' : 'D'
}

export const streakMultiplier = (streak: number): number => 1 + 0.1 * Math.min(streak, 5)

/** La précision du couteau attire la coupe vers la position idéale la plus proche. */
export function applyPrecision(pos: number, ideals: number[], precision: number): number {
  if (!ideals.length) return pos
  const nearest = ideals.reduce((b, i) => (Math.abs(i - pos) < Math.abs(b - pos) ? i : b))
  return pos + (nearest - pos) * precision * 0.5
}

export interface ScoreInput {
  mode: CutModeDef; bounds: Bounds; cuts: Cuts; peelCoverage: number
  durationMs: number; gainMult: number; streak: number
  /** multiplicateur de valeur (variété, améliorations, patate abîmée) */
  valueMult?: number
}

export function scoreRound(i: ScoreInput): RoundResult {
  const ps = peelScore(i.peelCoverage)
  const cs = cutScore(i.mode, i.bounds, i.cuts)
  const target = i.mode.passes.reduce((s, p) => s + p.cuts, 0)
  const made = i.cuts.x.length + i.cuts.y.length + i.cuts.z.length
  const completion = clamp(made / target, 0, 1)
  const par = i.mode.parTimeSec
  const speedBonus = clamp((par - i.durationMs / 1000) / par, 0, 1)
  const quality = 0.45 * ps + 0.45 * cs + 0.1 * completion
  const reward = Math.round(
    i.mode.baseReward * (0.25 + quality) * (1 + 0.5 * speedBonus) * i.gainMult * streakMultiplier(i.streak) * (i.valueMult ?? 1),
  )
  return { peelScore: ps, cutScore: cs, completion, speedBonus, quality, grade: gradeOf(quality), reward, durationMs: i.durationMs }
}
