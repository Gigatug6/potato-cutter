import { Group, Mesh, MeshStandardMaterial, Vector3, type BufferGeometry } from 'three'
import { buildPieceGeometry } from '../../game/cutting/pieceGeometry'
import type { Cell } from '../../game/cutting/cutPlan'
import type { PeelMap } from '../../game/potato/peelMap'
import type { PotatoShape } from '../../game/potato/potatoShape'

const SPREAD = 0.05

interface Item { mesh: Mesh; geo: BufferGeometry; center: Vector3; target: Vector3 }

/** Pièces découpées. Les cellules inchangées sont réutilisées (cache par clé). */
export class PiecesGroup {
  readonly group = new Group()
  private items = new Map<string, Item>()
  private readonly material = new MeshStandardMaterial({ vertexColors: true, roughness: 0.6 })

  get count(): number {
    return this.items.size
  }

  rebuild(cells: Cell[], counts: [number, number, number], shape: PotatoShape, peel: PeelMap): void {
    const next = new Map<string, Item>()
    for (const cell of cells) {
      const key = [...cell.min, ...cell.max].map((v) => v.toFixed(4)).join(',')
      let item = this.items.get(key)
      if (!item) {
        const piece = buildPieceGeometry(cell, shape, peel)
        if (!piece) continue
        const mesh = new Mesh(piece.geometry, this.material)
        mesh.castShadow = true
        mesh.position.set(piece.center[0], piece.center[1], piece.center[2])
        this.group.add(mesh)
        item = { mesh, geo: piece.geometry, center: new Vector3(...piece.center), target: new Vector3() }
      }
      item.target.set(
        item.center.x + (cell.index[0] - (counts[0] - 1) / 2) * SPREAD,
        item.center.y + (cell.index[1] - (counts[1] - 1) / 2) * SPREAD,
        item.center.z + (cell.index[2] - (counts[2] - 1) / 2) * SPREAD,
      )
      next.set(key, item)
      this.items.delete(key)
    }
    for (const old of this.items.values()) {
      this.group.remove(old.mesh)
      old.geo.dispose()
    }
    this.items = next
  }

  update(dt: number): void {
    const k = 1 - Math.exp(-12 * dt)
    for (const it of this.items.values()) it.mesh.position.lerp(it.target, k)
  }

  clear(): void {
    for (const it of this.items.values()) {
      this.group.remove(it.mesh)
      it.geo.dispose()
    }
    this.items.clear()
  }

  dispose(): void {
    this.clear()
    this.material.dispose()
  }
}
