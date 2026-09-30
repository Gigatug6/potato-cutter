// @vitest-environment happy-dom
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { idealPositions, type Bounds } from '../game/cutting/cutPlan'
import { useGameStore } from './game'
import { useProfileStore } from './profile'

const B: Bounds = { x: [-1, 1], y: [-1, 1], z: [-1, 1] }
const cuts = (n = 7) => ({ x: idealPositions(-1, 1, n), y: [], z: [] })

beforeEach(() => { localStorage.clear(); setActivePinia(createPinia()) })

describe('profile — patates, améliorations, quêtes', () => {
  it('achat et sélection de patate', () => {
    const p = useProfileStore()
    expect(p.buyPotato('ratte')).toBe('poor')
    p.earn(400)
    expect(p.buyPotato('ratte')).toBe('ok')
    expect(p.money).toBe(100)
    expect(p.buyPotato('ratte')).toBe('owned')
    expect(p.selectPotato('violette')).toBe(false)
    expect(p.selectPotato('ratte')).toBe(true)
    expect(p.valueMult).toBeCloseTo(1.35)
  })
  it('améliorations : niveaux, prix, plafond, effet sur la valeur', () => {
    const p = useProfileStore()
    p.earn(100000)
    for (let i = 0; i < 5; i++) expect(p.buyUpgrade('goldenBoard')).toBe('ok')
    expect(p.buyUpgrade('goldenBoard')).toBe('max')
    expect(p.upgradeLevel('goldenBoard')).toBe(5)
    expect(p.valueMult).toBeCloseTo(1.5)
    expect(p.buyUpgrade('nope')).toBe('unknown')
  })
  it('3 commandes au départ, quête réclamable une seule fois', () => {
    const p = useProfileStore()
    expect(p.orders).toHaveLength(3)
    const q = p.quests!.items[0]
    expect(p.claimQuest(q.id)).toBe(0)
    q.progress = q.target
    const money = p.money
    expect(p.claimQuest(q.id)).toBe(q.reward)
    expect(p.money).toBe(money + q.reward)
    expect(p.claimQuest(q.id)).toBe(0)
  })
})

describe('game — phase 6', () => {
  it('la valeur de la patate multiplie la récompense', () => {
    const g = useGameStore(), p = useProfileStore()
    g.startRound('rondelles', 42, null)
    g.setPeelCoverage(1); g.goToCutting()
    const base = g.finishRound(B, cuts())!.reward
    p.earn(400); p.buyPotato('ratte'); p.selectPotato('ratte')
    g.startRound('rondelles', 42, null)
    g.setPeelCoverage(1); g.goToCutting()
    const ratte = g.finishRound(B, cuts())!.reward
    expect(ratte).toBeGreaterThan(base)
  })
  it('patate abîmée : récompense ×0,1, série remise à zéro ; Jeter sans pénalité', () => {
    const g = useGameStore(), p = useProfileStore()
    p.stats.streak = 3
    g.startRound('rondelles', 1, 'rotten')
    expect(g.round!.bad).toBe('rotten')
    g.setPeelCoverage(1); g.goToCutting()
    const r = g.finishRound(B, cuts())!
    expect(r.reward).toBeLessThan(10)
    expect(p.stats.streak).toBe(0)
    g.startRound('rondelles', 2, 'green')
    const money = p.money
    expect(g.discardBadPotato()).toBe(true)
    expect(p.money).toBe(money)
    expect(g.round!.result).toBeUndefined()
    g.startRound('rondelles', 42, null)
    expect(g.discardBadPotato()).toBe(false)
  })
  it('commande livrée : bonus crédité et remplacée', () => {
    const g = useGameStore(), p = useProfileStore()
    p.orders = [
      { id: 'a', dishId: 'chips', mode: 'rondelles', minGrade: 'D', multiplier: 2, label: 'Chips' },
      { id: 'b', dishId: 'puree', mode: 'des', minGrade: 'D', multiplier: 1.4, label: 'Purée' },
      { id: 'c', dishId: 'salade', mode: 'des', minGrade: 'A', multiplier: 2.5, label: 'Salade' },
    ]
    g.startRound('rondelles', 42, null)
    g.setPeelCoverage(1); g.goToCutting()
    const r = g.finishRound(B, cuts())!
    expect(g.round!.order).toEqual({ label: 'Chips', bonus: r.reward * 2 })
    expect(p.money).toBe(r.reward * 3)
    expect(p.orders).toHaveLength(3)
    expect(p.orders.some((o) => o.id === 'a')).toBe(false)
  })
  it('chrono : score cumulé, fin au bout du temps, classement', () => {
    const g = useGameStore(), p = useProfileStore()
    g.startChallenge('rondelles', 1000)
    expect(g.challenge!.endsAt).toBe(61000)
    g.setPeelCoverage(1); g.goToCutting()
    const r = g.finishRound(B, cuts())!
    expect(g.challenge!.potatoes).toBe(1)
    expect(g.challenge!.score).toBeGreaterThanOrEqual(r.reward)
    g.nextPotato(2000)
    expect(g.phase).toBe('peeling')
    g.tickChallenge(70000)
    expect(g.challenge!.done).toBe(true)
    expect(g.challenge!.rank).toBe(1)
    expect(p.leaderboard).toHaveLength(1)
    g.tickChallenge(80000)
    expect(p.leaderboard).toHaveLength(1)
  })
})
