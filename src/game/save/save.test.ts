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
