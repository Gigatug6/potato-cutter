import {
  BoxGeometry, Color, CylinderGeometry, Group, Matrix4, Mesh, MeshStandardMaterial, Quaternion, Vector3, type BufferGeometry,
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
  private readonly target = new Quaternion()
  private readonly last = new Vector3()
  private readonly move = new Vector3()
  private placed = false

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

  /**
   * Posé sur la surface : l'axe « haut » de l'outil suit la normale (la lame est à plat sur la patate) et
   * le manche traîne derrière le sens du mouvement (la lame ouvre le passage).
   */
  placeAt(world: Vector3, normal: Vector3, working: boolean): void {
    const n = normal.clone().normalize()
    if (this.placed) {
      const d = world.clone().sub(this.last)
      if (d.lengthSq() > 1e-6) this.move.lerp(d.normalize(), 0.35)
    }
    this.last.copy(world)
    // direction du manche = opposée au mouvement, projetée sur le plan tangent (par défaut : vers la caméra/le bas de l'écran)
    let trail = this.move.clone().multiplyScalar(-1)
    if (trail.lengthSq() < 1e-4) trail = new Vector3(0, 0, 1)
    trail.addScaledVector(n, -trail.dot(n))
    if (trail.lengthSq() < 1e-4) trail = new Vector3(1, 0, 0).addScaledVector(n, -n.x)
    trail.normalize()
    const x = new Vector3().crossVectors(n, trail).normalize()
    this.target.setFromRotationMatrix(new Matrix4().makeBasis(x, n, trail))
    if (!this.placed) this.group.quaternion.copy(this.target)
    this.placed = true
    this.group.position.copy(world).addScaledVector(n, 0.012)
    this.active = working
    this.group.visible = true
  }

  show(v: boolean): void {
    this.group.visible = v
    if (!v) { this.placed = false; this.move.set(0, 0, 0) }
  }

  update(dt: number): void {
    this.time += dt
    this.group.quaternion.slerp(this.target, 1 - Math.exp(-14 * dt))
    const w = this.active ? Math.sin(this.time * 18) * 0.12 : 0
    this.inner.rotation.x = 0.55 + w
    this.inner.rotation.z = this.active ? Math.sin(this.time * 11) * 0.06 : 0
  }

  dispose(): void {
    this.geos.forEach((g) => g.dispose())
    this.mats.forEach((m) => m.dispose())
  }
}
