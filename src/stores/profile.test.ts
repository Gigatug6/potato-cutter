// @vitest-environment happy-dom
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { STARTER_KNIFE_ID } from '../game/data/knives'
import { SAVE_KEY } from '../game/save/storage'
import { installPersistence } from './persist'
import { useProfileStore } from './profile'

beforeEach(() => { localStorage.clear(); setActivePinia(createPinia()) })
afterEach(() => vi.useRealTimers())

describe('profile', () => {
  it('démarre avec le starter équipé', () => {
    const p = useProfileStore()
    expect(p.equippedKnifeId).toBe(STARTER_KNIFE_ID)
    expect(p.money).toBe(0)
  })
  it('buy : poor / ok / owned / crateOnly / unknown', () => {
    const p = useProfileStore()
    expect(p.buy('santoku-vert')).toBe('poor')
    p.earn(1000)
    expect(p.buy('santoku-vert')).toBe('ok')
    expect(p.money).toBe(500)
    expect(p.buy('santoku-vert')).toBe('owned')
    expect(p.buy('excalipatate')).toBe('crateOnly')
    expect(p.buy('nope')).toBe('unknown')
  })
  it('equip uniquement si possédé', () => {
    const p = useProfileStore()
    expect(p.equip('santoku-vert')).toBe(false)
    p.earn(500); p.buy('santoku-vert')
    expect(p.equip('santoku-vert')).toBe(true)
    expect(p.equippedKnife.id).toBe('santoku-vert')
  })
  it('caisse : débite et donne un couteau ou un remboursement', () => {
    const p = useProfileStore()
    expect(p.openCrate()).toBeNull()
    p.earn(1000)
    const r = p.openCrate()
    expect(r).not.toBeNull()
    expect(p.owns(r!.knifeId)).toBe(true)
  })
  it('persistance debounce', async () => {
    vi.useFakeTimers()
    const p = useProfileStore()
    const stop = installPersistence(300)
    p.earn(77)
    await nextTick()
    expect(localStorage.getItem(SAVE_KEY)).toBeNull()
    vi.advanceTimersByTime(350)
    expect(JSON.parse(localStorage.getItem(SAVE_KEY)!).money).toBe(77)
    stop()
  })
  it('resetSave remet à zéro', () => {
    const p = useProfileStore()
    p.earn(50); p.resetSave()
    expect(p.money).toBe(0)
  })
})
