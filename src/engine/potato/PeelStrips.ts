import {
  DoubleSide, InstancedMesh, LinearSRGBColorSpace, MeshStandardMaterial, Object3D, PlaneGeometry, Vector3, type BufferAttribute,
} from 'three'
import type { Vec3 } from '../../game/potato/potatoShape'
import { BOARD_TOP } from '../scene/Kitchen'
import type { SceneTextures } from '../scene/textures'

const N = 180
const FLOOR = BOARD_TOP + 0.012

/** Rubans de peau : tombent de la patate, atterrissent sur la planche et y restent jusqu'à la manche suivante. */
export class PeelStrips {
  readonly mesh: InstancedMesh
  private readonly mat: MeshStandardMaterial
  private readonly geo: PlaneGeometry
  private readonly pos = new Float32Array(N * 3)
  private readonly vel = new Float32Array(N * 3)
  private readonly rot = new Float32Array(N * 3)
  private readonly spin = new Float32Array(N * 3)
  private readonly landed = new Uint8Array(N)
  private readonly scale = new Float32Array(N)
  private total = 0
  private readonly dummy = new Object3D()

  constructor(tex: SceneTextures, look: { skinTint: Vec3 }) {
    this.geo = new PlaneGeometry(0.42, 0.1, 10, 1)
    const p = this.geo.getAttribute('position') as BufferAttribute
    for (let i = 0; i < p.count; i++) p.setZ(i, 0.07 * Math.sin((p.getX(i) / 0.42) * Math.PI * 1.6)) // ruban ondulé
    this.geo.rotateX(-Math.PI / 2) // à plat sur XZ
    this.geo.computeVertexNormals()
    this.mat = new MeshStandardMaterial({ map: tex.skinDiff, normalMap: tex.skinNor, roughness: 0.9, side: DoubleSide })
    this.mesh = new InstancedMesh(this.geo, this.mat, N)
    this.mesh.count = 0
    this.mesh.frustumCulled = false
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    this.setLook(look)
  }

  setLook(look: { skinTint: Vec3 }): void {
    this.mat.color.setRGB(look.skinTint[0], look.skinTint[1], look.skinTint[2], LinearSRGBColorSpace)
  }

  reset(): void {
    this.total = 0
    this.mesh.count = 0
  }

  /** Fait tomber un ruban depuis `at`, éjecté à l'opposé de `center` (centre de la patate). */
  spawn(at: Vector3, center: Vector3): void {
    const i = this.total % N
    this.total++
    this.mesh.count = Math.min(this.total, N)
    const away = new Vector3(at.x - center.x, 0, at.z - center.z).normalize()
    this.pos.set([at.x, at.y + 0.05, at.z], i * 3)
    this.vel.set([away.x * (0.5 + Math.random()) + (Math.random() - 0.5), 0.6 + Math.random() * 1.2, away.z * (0.5 + Math.random()) + (Math.random() - 0.5)], i * 3)
    this.rot.set([Math.random() * 6, Math.random() * 6, Math.random() * 6], i * 3)
    this.spin.set([(Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9], i * 3)
    this.landed[i] = 0
    this.scale[i] = 0.75 + Math.random() * 0.7
  }

  update(dt: number): void {
    let dirty = false
    for (let i = 0; i < this.mesh.count; i++) {
      if (!this.landed[i]) {
        dirty = true
        const k = i * 3
        this.vel[k + 1] -= 6 * dt
        this.pos[k] += this.vel[k] * dt
        this.pos[k + 1] += this.vel[k + 1] * dt
        this.pos[k + 2] += this.vel[k + 2] * dt
        this.rot[k] += this.spin[k] * dt
        this.rot[k + 1] += this.spin[k + 1] * dt
        this.rot[k + 2] += this.spin[k + 2] * dt
        if (this.pos[k + 1] <= FLOOR) {
          this.landed[i] = 1
          this.pos[k] = Math.max(-3.2, Math.min(3.2, this.pos[k]))
          this.pos[k + 2] = Math.max(-2, Math.min(2, this.pos[k + 2]))
          this.pos[k + 1] = FLOOR
          this.rot[k] = (Math.random() - 0.5) * 0.25
          this.rot[k + 1] = Math.random() * Math.PI * 2
          this.rot[k + 2] = (Math.random() - 0.5) * 0.25
        }
      }
      this.dummy.position.set(this.pos[i * 3], this.pos[i * 3 + 1], this.pos[i * 3 + 2])
      this.dummy.rotation.set(this.rot[i * 3], this.rot[i * 3 + 1], this.rot[i * 3 + 2])
      this.dummy.scale.setScalar(this.scale[i])
      if (!this.landed[i] || dirty) {
        this.dummy.updateMatrix()
        this.mesh.setMatrixAt(i, this.dummy.matrix)
      }
    }
    if (dirty) this.mesh.instanceMatrix.needsUpdate = true
  }

  dispose(): void {
    this.geo.dispose()
    this.mat.dispose()
    this.mesh.dispose()
  }
}
