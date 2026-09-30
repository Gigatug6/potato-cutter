import {
  BoxGeometry, Color, CylinderGeometry, Group, Mesh, MeshStandardMaterial, type BufferGeometry, type Vector3,
} from 'three'
import type { SceneTextures } from '../scene/textures'

/** Éplucheur « en Y » texturé (manche en bois, lame et cadre en acier usé). La pointe de la lame est à l'origine. */
export class PeelerTool {
  readonly group = new Group()
  private readonly inner = new Group()
  private readonly geos: BufferGeometry[] = []
  private readonly mats: MeshStandardMaterial[] = []
  private time = 0
  private active = false

  constructor(tex: SceneTextures) {
    const wood = new MeshStandardMaterial({ map: tex.woodDiff, normalMap: tex.woodNor, roughness: 0.6, color: new Color(1.5, 1.4, 1.3) })
    const steel = new MeshStandardMaterial({ map: tex.metalDiff, normalMap: tex.metalNor, metalness: 0.75, roughness: 0.4, color: new Color(2.4, 2.4, 2.4) })
    this.mats.push(wood, steel)
    const add = (geo: BufferGeometry, mat: MeshStandardMaterial, x: number, y: number, z: number, rz = 0) => {
      this.geos.push(geo)
      const m = new Mesh(geo, mat)
      m.position.set(x, y, z)
      m.rotation.z = rz
      m.castShadow = true
      this.inner.add(m)
    }
    add(new BoxGeometry(0.34, 0.022, 0.16), steel, 0, 0.011, 0) // lame
    add(new BoxGeometry(0.03, 0.42, 0.035), steel, -0.14, 0.22, 0, -0.12) // bras gauche
    add(new BoxGeometry(0.03, 0.42, 0.035), steel, 0.14, 0.22, 0, 0.12) // bras droit
    add(new BoxGeometry(0.3, 0.035, 0.04), steel, 0, 0.44, 0) // barre du haut
    add(new CylinderGeometry(0.022, 0.022, 0.22, 10), steel, 0, 0.56, 0) // col
    add(new CylinderGeometry(0.055, 0.065, 0.6, 14), wood, 0, 0.97, 0) // manche
    this.inner.rotation.x = 0.55 // manche incliné vers la caméra
    this.inner.scale.setScalar(0.85)
    this.group.add(this.inner)
    this.group.visible = false
  }

  show(v: boolean): void {
    this.group.visible = v
  }

  /** Posé sur la patate ; `working` = petit mouvement de va-et-vient. */
  placeAt(world: Vector3, working: boolean): void {
    this.group.position.copy(world)
    this.active = working
    this.group.visible = true
  }

  update(dt: number): void {
    this.time += dt
    const w = this.active ? Math.sin(this.time * 18) * 0.12 : 0
    this.inner.rotation.x = 0.55 + w
    this.inner.rotation.z = this.active ? Math.sin(this.time * 11) * 0.06 : 0
  }

  dispose(): void {
    this.geos.forEach((g) => g.dispose())
    this.mats.forEach((m) => m.dispose())
  }
}
