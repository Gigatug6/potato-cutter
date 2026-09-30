// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { STARTER_KNIFE_ID } from '../data/knives'
import { defaultSave, parseSave } from './saveSchema'
import { SAVE_KEY, loadSave, writeSave } from './storage'

afterEach(() => { localStorage.clear(); vi.restoreAllMocks() })

describe('parseSave', () => {
  it('null / junk → défaut', () => {
    expect(parseSave(null)).toEqual(defaultSave())
    expect(parseSave('x')).toEqual(defaultSave())
    expect(parseSave({ version: 2 })).toEqual(defaultSave())
  })
  it('répare argent négatif / chaîne', () => {
    expect(parseSave({ version: 1, money: -5 }).money).toBe(0)
    expect(parseSave({ version: 1, money: '12' }).money).toBe(0)
    expect(parseSave({ version: 1, money: 12.7 }).money).toBe(12)
  })
  it('filtre les couteaux inconnus et rééquipe le starter', () => {
    const s = parseSave({ version: 1, ownedKnives: { ghost: { count: 1 } }, equippedKnifeId: 'ghost' })
    expect(Object.keys(s.ownedKnives)).toEqual([STARTER_KNIFE_ID])
    expect(s.equippedKnifeId).toBe(STARTER_KNIFE_ID)
  })
  it('couteau équipé non possédé → starter', () => {
    expect(parseSave({ version: 1, equippedKnifeId: 'excalipatate' }).equippedKnifeId).toBe(STARTER_KNIFE_ID)
  })
})

describe('storage', () => {
  it('aller-retour', () => {
    const s = defaultSave(); s.money = 321
    writeSave(s)
    expect(loadSave().money).toBe(321)
  })
  it('JSON corrompu → défaut', () => {
    localStorage.setItem(SAVE_KEY, '{oops')
    expect(loadSave()).toEqual(defaultSave())
  })
  it('setItem qui lève est avalé', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    expect(() => writeSave(defaultSave())).not.toThrow()
  })
})

describe('parseSave — phase 6', () => {
  it('anciennes sauvegardes : valeurs par défaut', () => {
    const s = parseSave({ version: 1, money: 10 })
    expect(s.unlockedPotatoes).toEqual(['bintje'])
    expect(s.selectedPotatoId).toBe('bintje')
    expect(s.orders).toEqual([])
    expect(s.quests).toBeNull()
  })
  it('répare les données invalides', () => {
    const s = parseSave({
      version: 1, unlockedPotatoes: ['ratte', 'fantome', 3], selectedPotatoId: 'violette',
      upgrades: { autoPeeler: 99, bigPotatoes: -2, inconnu: 4 },
      orders: [{ bad: true }], quests: { day: 'x', items: [{ nope: 1 }] },
      leaderboard: [{ score: 'a' }, { score: 5, potatoes: 1, mode: 'des', date: 'd' }],
    })
    expect(s.unlockedPotatoes).toEqual(['bintje', 'ratte'])
    expect(s.selectedPotatoId).toBe('bintje') // non débloquée
    expect(s.upgrades).toEqual({ autoPeeler: 5, bigPotatoes: 0, goldenBoard: 0 })
    expect(s.orders).toEqual([])
    expect(s.quests).toBeNull()
    expect(s.leaderboard).toHaveLength(1)
  })
})
