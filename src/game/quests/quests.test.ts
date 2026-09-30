import { describe, expect, it } from 'vitest'
import { applyRound, ensureQuests, generateQuests, isComplete, todayKey } from './quests'

describe('quests', () => {
  it('3 quêtes déterministes par jour, différentes selon le jour', () => {
    expect(generateQuests('2026-01-01')).toHaveLength(3)
    expect(generateQuests('2026-01-01')).toEqual(generateQuests('2026-01-01'))
    expect(generateQuests('2026-01-01')).not.toEqual(generateQuests('2026-01-02'))
  })
  it('todayKey au format AAAA-MM-JJ', () => {
    expect(todayKey(new Date(2026, 8, 5))).toBe('2026-09-05')
  })
  it('ensureQuests régénère au changement de jour, garde sinon', () => {
    const a = ensureQuests(null, '2026-01-01')
    a.items[0].progress = 2
    expect(ensureQuests(a, '2026-01-01')).toBe(a)
    expect(ensureQuests(a, '2026-01-02').items[0].progress).toBe(0)
  })
  it('applyRound met à jour la progression (plafonnée) ; notes et modes', () => {
    const items = generateQuests('2026-03-03')
    let cur = items
    for (let i = 0; i < 30; i++) cur = applyRound(cur, { mode: 'rondelles', grade: 'S', reward: 50 })
    const potatoes = cur.find((q) => q.type === 'potatoes')!
    expect(potatoes.progress).toBe(potatoes.target)
    expect(isComplete(potatoes)).toBe(true)
    const good = cur.find((q) => q.type === 'goodGrade')!
    expect(isComplete(good)).toBe(true)
    const low = applyRound(items, { mode: 'rondelles', grade: 'D', reward: 0 }).find((q) => q.type === 'goodGrade')!
    expect(low.progress).toBe(0)
  })
  it('une quête réclamée ne progresse plus', () => {
    const q = { ...generateQuests('2026-03-03')[0], claimed: true }
    expect(applyRound([q], { mode: 'des', grade: 'S', reward: 1 })[0].progress).toBe(0)
  })
})
