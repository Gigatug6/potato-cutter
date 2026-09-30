import { Box3, Mesh, MeshStandardMaterial } from 'three'
import { describe, expect, it } from 'vitest'
import { KNIVES } from '../../game/data/knives'
import { buildKnife } from './buildKnife'

describe('buildKnife', () => {
  for (const def of KNIVES) {
    it(`construit ${def.id}`, () => {
      const k = buildKnife(def)
      const size = new Box3().setFromObject(k.group).getSize(new (k.group.position.constructor as any)())
      expect(Math.max(size.x, size.y, size.z)).toBeGreaterThan(0.8)
      expect(Math.max(size.x, size.y, size.z)).toBeLessThan(3)
      k.update(1)
      if (def.rarity === 'legendaire') {
        let emissive = false
        k.group.traverse((o) => {
          if (o instanceof Mesh && (o.material as MeshStandardMaterial).emissiveIntensity > 0) emissive = true
        })
        expect(emissive).toBe(true)
      }
      k.dispose()
    })
  }
})
