import { describe, expect, it } from 'vitest'
import { ACHIEVEMENTS, newlyUnlocked, type AchievementContext } from './achievements'

const zero: AchievementContext = {
  potatoes: 0, sGrades: 0, streak: 0, totalEarned: 0, knivesOwned: 1, knivesTotal: 12, rareKnives: 0, legendaryKnives: 0,
  potatoKinds: 1, potatoKindsTotal: 6, upgradeMaxed: 0, decorOwned: 3, ordersDelivered: 0, challenges: 0, bestChallengeScore: 0, photos: 0, crates: 0,
}

describe('achievements', () => {
  it('ids uniques, récompenses positives, aucun succès débloqué au départ', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length)
    for (const a of ACHIEVEMENTS) expect(a.reward).toBeGreaterThan(0)
    expect(newlyUnlocked(zero, [])).toEqual([])
  })
  it('se débloquent au seuil, une seule fois', () => {
    const ids = (c: Partial<AchievementContext>, done: string[] = []) => newlyUnlocked({ ...zero, ...c }, done).map((a) => a.id)
    expect(ids({ potatoes: 1 })).toEqual(['first-potato'])
    expect(ids({ potatoes: 10 })).toEqual(['first-potato', 'potatoes-10'])
    expect(ids({ potatoes: 10 }, ['first-potato', 'potatoes-10'])).toEqual([])
    expect(ids({ totalEarned: 12000 })).toEqual(['rich-1k', 'rich-10k'])
    expect(ids({ knivesOwned: 12 })).toEqual(['collector'])
    expect(ids({ decorOwned: 6 })).toEqual(['decorator'])
  })
  it('progress borné à la cible', () => {
    const a = ACHIEVEMENTS.find((x) => x.id === 'potatoes-10')!
    expect(a.progress!({ ...zero, potatoes: 3 })).toEqual([3, 10])
    expect(a.progress!({ ...zero, potatoes: 99 })).toEqual([10, 10])
  })
})
