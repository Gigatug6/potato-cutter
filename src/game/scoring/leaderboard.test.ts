import { describe, expect, it } from 'vitest'
import { addScore, LEADERBOARD_SIZE, type ScoreEntry } from './leaderboard'

const e = (score: number): ScoreEntry => ({ score, potatoes: 1, mode: 'rondelles', date: '2026-01-01' })

describe('leaderboard', () => {
  it('trie et donne le rang', () => {
    let list: ScoreEntry[] = []
    list = addScore(list, e(10)).list
    const r = addScore(list, e(50))
    expect(r.rank).toBe(1)
    expect(r.list.map((x) => x.score)).toEqual([50, 10])
  })
  it('limite à 10 ; hors classement → rang null', () => {
    let list: ScoreEntry[] = []
    for (let i = 1; i <= LEADERBOARD_SIZE; i++) list = addScore(list, e(i * 10)).list
    const low = addScore(list, e(1))
    expect(low.rank).toBeNull()
    expect(low.list).toHaveLength(LEADERBOARD_SIZE)
    expect(addScore(list, e(55)).rank).toBe(6)
  })
})
