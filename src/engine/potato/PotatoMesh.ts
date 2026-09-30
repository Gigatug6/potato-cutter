import { BufferAttribute, BufferGeometry, Color, IcosahedronGeometry, Mesh, MeshStandardMaterial } from 'three'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { createRng } from '../../game/core/rng'
import type { PeelMap } from '../../game/potato/peelMap'
import { radiusAt, type PotatoShape, type Vec3 } from '../../game/potato/potatoShape'
import { FLESH } from '../../game/cutting/pieceGeometry'

const PEELED_INSET = 0.985

/** Patate entière : icosphère déformée, couleurs par sommet (peau / chair). */
export class PotatoMesh {
  readonly mesh: Mesh
  private readonly geo: BufferGeometry
  private readonly dirs: Vec3[] = []
  private readonly radii: number[] = []
  private readonly skin: Float32Array

  constructor(shape: PotatoShape, private readonly peel: PeelMap) {
    const base = new IcosahedronGeometry(1, 20)
    base.deleteAttribute('normal')
    base.deleteAttribute('uv')
    this.geo = mergeVertices(base, 1e-4)
    base.dispose()
    const pos = this.geo.getAttribute('position') as BufferAttribute
    const rng = createRng(shape.seed ^ 0x9e3779b9)
    this.skin = new Float32Array(pos.count * 3)
    const eyeCenters: Vec3[] = Array.from({ length: 9 }, () => {
      const t = Math.acos(2 * rng() - 1), p = rng() * Math.PI * 2
      return [Math.sin(t) * Math.cos(p), Math.cos(t), Math.sin(t) * Math.sin(p)]
    })
    const tint = new Color()
    for (let i = 0; i < pos.count; i++) {
      const l = Math.hypot(pos.getX(i), pos.getY(i), pos.getZ(i))
      const d: Vec3 = [pos.getX(i) / l, pos.getY(i) / l, pos.getZ(i) / l]
      this.dirs.push(d)
      const r = radiusAt(shape, d)
      this.radii.push(r)
      const v = (rng() - 0.5) * 0.06
      const eye = eyeCenters.some((e) => e[0] * d[0] + e[1] * d[1] + e[2] * d[2] > 0.992)
      tint.setRGB(0.56 + v, 0.39 + v, 0.23 + v)
      if (eye) tint.multiplyScalar(0.45)
      this.skin.set([tint.r, tint.g, tint.b], i * 3)
    }
    this.geo.setAttribute('color', new BufferAttribute(new Float32Array(pos.count * 3), 3))
    this.mesh = new Mesh(this.geo, new MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }))
    this.mesh.castShadow = true
    this.refresh()
  }

  /** Recalcule positions et couleurs depuis la peelMap. */
  refresh(): void {
    const pos = this.geo.getAttribute('position') as BufferAttribute
    const col = this.geo.getAttribute('color') as BufferAttribute
    for (let i = 0; i < this.dirs.length; i++) {
      const d = this.dirs[i]
      const peeled = this.peel.sample(d)
      const r = this.radii[i] * (peeled ? PEELED_INSET : 1)
      pos.setXYZ(i, d[0] * r, d[1] * r, d[2] * r)
      if (peeled) col.setXYZ(i, FLESH[0], FLESH[1], FLESH[2])
      else col.setXYZ(i, this.skin[i * 3], this.skin[i * 3 + 1], this.skin[i * 3 + 2])
    }
    pos.needsUpdate = true
    col.needsUpdate = true
    this.geo.computeVertexNormals()
    this.geo.computeBoundingSphere()
  }

  dispose(): void {
    this.geo.dispose()
    ;(this.mesh.material as MeshStandardMaterial).dispose()
  }
}
