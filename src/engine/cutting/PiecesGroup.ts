import { Group, Mesh, Vector3, type BufferGeometry, type MeshPhysicalMaterial, type Object3D } from 'three'
import { createPotatoMaterial, type PotatoLook } from '../potato/potatoMaterial'
import type { SceneTextures } from '../scene/textures'
import { buildPieceGeometry, DEFAULT_COLORS, type PieceColors } from '../../game/cutting/pieceGeometry'
import type { Cell } from '../../game/cutting/cutPlan'
import type { PeelMap } from '../../game/potato/peelMap'
import type { PotatoShape } from '../../game/potato/potatoShape'

const SPREAD = 0.05

interface Item { mesh: Mesh; geo: BufferGeometry; center: Vector3; target: Vector3; fly?: { from: Vector3; delay: number; dur: number; spin: Vector3; done: boolean } }

/** Pièces découpées. Les cellules inchangées sont réutilisées (cache par clé). */
export class PiecesGroup {
  readonly group = new Group()
  private items = new Map<string, Item>()
  private material: MeshPhysicalMaterial | null = null

  get count(): number {
    return this.items.size
  }

  colors: PieceColors = DEFAULT_COLORS

  /** Matériau texturé (peau + chair) pour la variété courante. À appeler après clear(). */
  setLook(tex: SceneTextures, look: PotatoLook): void {
    this.material?.dispose()
    this.material = createPotatoMaterial(tex, look, { vertexColors: false, normal: false, fleshScale: 1.6 })
  }

  rebuild(cells: Cell[], counts: [number, number, number], shape: PotatoShape, peel: PeelMap): void {
    const next = new Map<string, Item>()
    for (const cell of cells) {
      const key = [...cell.min, ...cell.max].map((v) => v.toFixed(4)).join(',')
      let item = this.items.get(key)
      if (!item) {
        const piece = buildPieceGeometry(cell, shape, peel, this.colors)
        if (!piece) continue
        const mesh = new Mesh(piece.geometry, this.material!)
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
      old.mesh.removeFromParent()
      old.geo.dispose()
    }
    this.items = next
  }

  private flying: { root: Object3D; target: Vector3; time: number; total: number; onSplash: (p: Vector3) => void; onDone: () => void } | null = null

  /** Envoie toutes les pièces dans la friteuse (cible en coordonnées monde). */
  launch(root: Object3D, target: Vector3, onSplash: (p: Vector3) => void, onDone: () => void): void {
    const list = [...this.items.values()]
    list.forEach((it, i) => {
      const from = it.mesh.getWorldPosition(new Vector3())
      root.attach(it.mesh) // garde la transformation monde
      it.fly = { from, delay: (i / Math.max(1, list.length)) * 0.6, dur: 0.7, spin: new Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6), done: false }
    })
    this.flying = { root, target, time: 0, total: 0.6 + 0.7 + 0.1, onSplash, onDone }
    if (!list.length) this.flying.total = 0.3
  }

  cancelLaunch(): void {
    this.flying = null
  }

  /** dt : pas clampé pour l'animation douce ; realDt : temps réel (clampé à 0,25 s) pour la friteuse. */
  update(dt: number, realDt = dt): void {
    const f = this.flying
    if (f) {
      f.time += realDt
      for (const it of this.items.values()) {
        if (!it.fly || it.fly.done) continue
        const u = Math.min(1, Math.max(0, (f.time - it.fly.delay) / it.fly.dur))
        if (u <= 0) continue
        const p = it.fly.from.clone().lerp(f.target, u)
        p.y += 4 * 1.6 * u * (1 - u)
        it.mesh.position.copy(p)
        it.mesh.rotation.set(it.fly.spin.x * u, it.fly.spin.y * u, it.fly.spin.z * u)
        it.mesh.scale.setScalar(1 - 0.5 * u * u)
        if (u >= 1) {
          it.fly.done = true
          it.mesh.visible = false
          f.onSplash(f.target)
        }
      }
      if (f.time >= f.total) {
        this.flying = null
        f.onDone()
      }
      return
    }
    const k = 1 - Math.exp(-12 * dt)
    for (const it of this.items.values()) if (!it.fly) it.mesh.position.lerp(it.target, k)
  }

  clear(): void {
    for (const it of this.items.values()) {
      it.mesh.removeFromParent()
      it.geo.dispose()
    }
    this.items.clear()
    this.flying = null
  }

  dispose(): void {
    this.clear()
    this.material?.dispose()
  }
}
