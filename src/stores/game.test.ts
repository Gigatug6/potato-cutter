// @vitest-environment happy-dom
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { CUT_MODES } from '../game/cutting/cutModes'
import { idealPositions, type Bounds } from '../game/cutting/cutPlan'
import { useGameStore } from './game'
import { useProfileStore } from './profile'

const B: Bounds = { x: [-1, 1], y: [-1, 1], z: [-1, 1] }

beforeEach(() => { localStorage.clear(); setActivePinia(createPinia()) })

describe('game', () => {
  it('cycle complet → argent gagné, idempotent', () => {
    const g = useGameStore(), p = useProfileStore()
    g.startRound('rondelles', 1)
    expect(g.phase).toBe('peeling')
    expect(g.goToCutting()).toBe(false)
    g.setPeelCoverage(0.98)
    expect(g.goToCutting()).toBe(true)
    const cuts = { x: idealPositions(-1, 1, CUT_MODES.rondelles.passes[0].cuts), y: [], z: [] }
    const r = g.finishRound(B, cuts)
    expect(r!.reward).toBeGreaterThan(0)
    // l'argent = récompense (+ éventuel bonus de commande livrée)
    const money = p.money
    expect(money).toBeGreaterThanOrEqual(r!.reward)
    g.finishRound(B, cuts)
    expect(p.money).toBe(money)
    expect(g.phase).toBe('results')
    expect(p.stats.potatoes).toBe(1)
  })
})
