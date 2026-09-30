import { defineStore } from 'pinia'
import { ref } from 'vue'
import { CUT_MODES, totalCuts, type CutModeId } from '../game/cutting/cutModes'
import type { Bounds, Cuts } from '../game/cutting/cutPlan'
import { scoreRound, type RoundResult } from '../game/scoring/scoring'
import { useProfileStore } from './profile'

export type Phase = 'idle' | 'peeling' | 'cutting' | 'results'
export type Screen = 'menu' | 'game' | 'shop' | 'collection' | 'settings'

export interface RoundState {
  seed: number
  mode: CutModeId
  startedAt: number
  peelCoverage: number
  cutCount: number
  pieceCount: number
  result?: RoundResult
}

export const MIN_PEEL_TO_CUT = 0.5

export const useGameStore = defineStore('game', () => {
  const screen = ref<Screen>('menu')
  const phase = ref<Phase>('idle')
  const round = ref<RoundState | null>(null)

  function startRound(mode: CutModeId, seed = Math.floor(Math.random() * 1e9)): void {
    round.value = { seed, mode, startedAt: Date.now(), peelCoverage: 0, cutCount: 0, pieceCount: 0 }
    phase.value = 'peeling'
    screen.value = 'game'
  }

  function setPeelCoverage(c: number): void {
    if (round.value) round.value.peelCoverage = Math.max(round.value.peelCoverage, Math.min(1, c))
  }

  function goToCutting(): boolean {
    if (!round.value || phase.value !== 'peeling' || round.value.peelCoverage < MIN_PEEL_TO_CUT) return false
    phase.value = 'cutting'
    return true
  }

  function registerCut(pieceCount: number): void {
    if (!round.value) return
    round.value.cutCount++
    round.value.pieceCount = pieceCount
  }

  function targetCuts(): number {
    return round.value ? totalCuts(CUT_MODES[round.value.mode]) : 0
  }

  /** Termine la manche ; idempotent. */
  function finishRound(bounds: Bounds, cuts: Cuts): RoundResult | null {
    const r = round.value
    if (!r) return null
    if (r.result) return r.result
    const profile = useProfileStore()
    const durationMs = Date.now() - r.startedAt
    const res = scoreRound({
      mode: CUT_MODES[r.mode], bounds, cuts, peelCoverage: r.peelCoverage, durationMs,
      gainMult: profile.equippedKnife.stats.gainMult, streak: profile.stats.streak,
    })
    r.result = res
    profile.earn(res.reward)
    const st = profile.stats
    st.potatoes++
    st.streak = res.grade === 'S' || res.grade === 'A' ? st.streak + 1 : 0
    const order = ['S', 'A', 'B', 'C', 'D']
    const best = st.bestGrade[r.mode]
    if (!best || order.indexOf(res.grade) < order.indexOf(best)) st.bestGrade[r.mode] = res.grade
    const bt = st.bestTimeMs[r.mode]
    if (res.completion >= 1 && (bt === null || durationMs < bt)) st.bestTimeMs[r.mode] = durationMs
    phase.value = 'results'
    return res
  }

  function backToMenu(): void {
    round.value = null
    phase.value = 'idle'
    screen.value = 'menu'
  }

  return { screen, phase, round, startRound, setPeelCoverage, goToCutting, registerCut, targetCuts, finishRound, backToMenu }
})
