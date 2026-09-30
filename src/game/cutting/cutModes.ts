import type { Axis } from '../potato/potatoShape'

export type CutModeId = 'rondelles' | 'frites' | 'des'
export interface CutPass { axis: Axis; cuts: number }
export interface CutModeDef { id: CutModeId; label: string; passes: CutPass[]; baseReward: number; parTimeSec: number }

export const CUT_MODES: Record<CutModeId, CutModeDef> = {
  rondelles: { id: 'rondelles', label: 'Rondelles', passes: [{ axis: 'x', cuts: 7 }], baseReward: 25, parTimeSec: 30 },
  frites: { id: 'frites', label: 'Frites', passes: [{ axis: 'y', cuts: 4 }, { axis: 'z', cuts: 4 }], baseReward: 70, parTimeSec: 60 },
  des: { id: 'des', label: 'Dés', passes: [{ axis: 'x', cuts: 5 }, { axis: 'y', cuts: 4 }, { axis: 'z', cuts: 4 }], baseReward: 150, parTimeSec: 90 },
}

export const totalCuts = (m: CutModeDef): number => m.passes.reduce((s, p) => s + p.cuts, 0)
