import { describe, expect, it } from 'vitest'
import { DECOR, DEFAULT_DECOR, decorById, sanitizeEquipped, toggleEquip } from './decor'

describe('decor', () => {
  it('ids uniques, défauts gratuits pour board/wall/mood', () => {
    expect(new Set(DECOR.map((d) => d.id)).size).toBe(DECOR.length)
    expect(DEFAULT_DECOR.map((d) => decorById(d)!.price)).toEqual([0, 0, 0])
    expect(DECOR.filter((d) => d.price === 0).map((d) => d.id).sort()).toEqual([...DEFAULT_DECOR].sort())
  })
  it('chaque décor a sa définition de style', () => {
    for (const d of DECOR) {
      if (d.category === 'board') expect(d.board).toBeDefined()
      if (d.category === 'wall') expect(d.wall).toBeDefined()
      if (d.category === 'mood') expect(d.mood).toBeDefined()
      if (d.category === 'prop') expect(d.prop).toBeDefined()
    }
  })
  it('toggleEquip : remplace dans la catégorie, bascule les objets', () => {
    let e = toggleEquip(DEFAULT_DECOR, 'board-marble')
    expect(e).toContain('board-marble')
    expect(e).not.toContain('board-wood')
    e = toggleEquip(e, 'prop-plant')
    e = toggleEquip(e, 'prop-lamp')
    expect(e.filter((x) => x.startsWith('prop-'))).toHaveLength(2)
    e = toggleEquip(e, 'prop-plant')
    expect(e).not.toContain('prop-plant')
  })
  it('sanitizeEquipped : non possédés / inconnus / doublons réparés', () => {
    const owned = ['board-wood', 'wall-plaster', 'mood-studio', 'board-marble']
    expect(sanitizeEquipped(null, owned).sort()).toEqual([...DEFAULT_DECOR].sort())
    const s = sanitizeEquipped(['board-slate', 'board-marble', 'board-wood', 'nope', 3], owned)
    expect(s.filter((x) => x.startsWith('board-'))).toHaveLength(1)
    expect(s).not.toContain('board-slate')
    expect(s).toContain('wall-plaster')
    expect(s).toContain('mood-studio')
  })
})
