import { defineStore } from 'pinia'
import { ref } from 'vue'
import { CUT_MODES, totalCuts, type CutModeId } from '../game/cutting/cutModes'
import { BAD_REWARD_MULT, badKindForSeed, type BadKind } from '../game/data/potatoes'
import { CHALLENGE_SECONDS } from '../game/scoring/leaderboard'
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
  potatoId: string
  bad: BadKind | null
  result?: RoundResult
  /** commande livrée avec cette manche */
  order?: { label: string; bonus: number }
}

export interface Challenge {
  mode: CutModeId
  endsAt: number
  potatoes: number
  score: number
  done: boolean
  rank: number | null
}

export const MIN_PEEL_TO_CUT = 0.5

export const useGameStore = defineStore('game', () => {
  const screen = ref<Screen>('menu')
  const phase = ref<Phase>('idle')
  const round = ref<RoundState | null>(null)
  const rotateMode = ref(false)
  const resultsVisible = ref(false)
  const challenge = ref<Challenge | null>(null)

  function startRound(mode: CutModeId, seed = Math.floor(Math.random() * 1e9), bad?: BadKind | null): void {
    const profile = useProfileStore()
    round.value = {
      seed, mode, startedAt: Date.now(), peelCoverage: 0, cutCount: 0, pieceCount: 0,
      potatoId: profile.selectedPotatoId, bad: bad === undefined ? badKindForSeed(seed) : bad,
    }
    resultsVisible.value = false
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
      valueMult: profile.valueMult * (r.bad ? BAD_REWARD_MULT : 1),
    })
    r.result = res
    profile.earn(res.reward)
    const st = profile.stats
    st.potatoes++
    st.streak = !r.bad && (res.grade === 'S' || res.grade === 'A') ? st.streak + 1 : 0
    const order = ['S', 'A', 'B', 'C', 'D']
    const best = st.bestGrade[r.mode]
    if (!best || order.indexOf(res.grade) < order.indexOf(best)) st.bestGrade[r.mode] = res.grade
    const bt = st.bestTimeMs[r.mode]
    if (res.completion >= 1 && (bt === null || durationMs < bt)) st.bestTimeMs[r.mode] = durationMs
    const delivered = profile.recordRound({ mode: r.mode, grade: res.grade, reward: res.reward })
    if (delivered) r.order = { label: delivered.order.label, bonus: delivered.bonus }
    if (challenge.value && !challenge.value.done) {
      challenge.value.potatoes++
      challenge.value.score += res.reward + (delivered?.bonus ?? 0)
    }
    phase.value = 'results'
    return res
  }

  /** Jeter une patate abîmée : sans pénalité, nouvelle patate. */
  function discardBadPotato(): boolean {
    const r = round.value
    if (!r || !r.bad || r.result || (phase.value !== 'peeling' && phase.value !== 'cutting')) return false
    startRound(r.mode)
    return true
  }

  function startChallenge(mode: CutModeId, now = Date.now()): void {
    challenge.value = { mode, endsAt: now + CHALLENGE_SECONDS * 1000, potatoes: 0, score: 0, done: false, rank: null }
    startRound(mode)
  }

  /** Patate suivante (en chrono : la suite, ou la fin si le temps est écoulé). */
  function nextPotato(now = Date.now()): void {
    const c = challenge.value
    if (c && !c.done) {
      if (now >= c.endsAt) endChallenge()
      else startRound(c.mode)
    } else if (round.value) startRound(round.value.mode)
  }

  function tickChallenge(now = Date.now()): void {
    const c = challenge.value
    if (c && !c.done && now >= c.endsAt) endChallenge()
  }

  function endChallenge(): void {
    const c = challenge.value
    if (!c || c.done) return
    c.done = true
    c.rank = useProfileStore().submitScore({ score: c.score, potatoes: c.potatoes, mode: c.mode, date: new Date().toISOString().slice(0, 10) })
    phase.value = 'idle'
  }

  function backToMenu(): void {
    challenge.value = null
    round.value = null
    phase.value = 'idle'
    screen.value = 'menu'
  }

  return { screen, phase, round, rotateMode, resultsVisible, challenge, discardBadPotato, startChallenge, nextPotato, tickChallenge, endChallenge, startRound, setPeelCoverage, goToCutting, registerCut, targetCuts, finishRound, backToMenu }
})
