import { BufferAttribute, BufferGeometry, Color, IcosahedronGeometry, Mesh, MeshPhysicalMaterial, type Material, type MeshStandardMaterial } from 'three'
import type { SceneTextures } from '../scene/textures'
import { createPotatoMaterial, type PotatoLook } from './potatoMaterial'

export type { PotatoLook }
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { createRng } from '../../game/core/rng'
import type { PeelMap } from '../../game/potato/peelMap'
import { radiusAt, type PotatoShape, type Vec3 } from '../../game/potato/potatoShape'

const PEELED_INSET = 0.985

/** Patate entière : icosphère déformée, couleurs par sommet (peau / chair). */
export class PotatoMesh {
  readonly mesh: Mesh
  private readonly geo: BufferGeometry
  private readonly dirs: Vec3[] = []
  private readonly radii: number[] = []
  private readonly skin: Float32Array
  private readonly peelAttr: BufferAttribute

  private readonly look: PotatoLook
  private readonly tex: SceneTextures
  private rasterMaterial: Material | null = null

  constructor(shape: PotatoShape, private readonly peel: PeelMap, tex: SceneTextures, look: PotatoLook) {
    this.look = look
    this.tex = tex
    const base = new IcosahedronGeometry(1, 20)
    base.rotateZ(Math.PI / 2) // pôles d'UV aux extrémités (axe long) plutôt que sur le dessus
    base.deleteAttribute('normal')
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
      tint.setRGB(0.92 + v, 0.92 + v, 0.92 + v)
      if (eye) tint.multiplyScalar(0.4)
      this.skin.set([tint.r, tint.g, tint.b], i * 3)
    }
    const colors = new Float32Array(pos.count * 4).fill(1) // RGBA (alpha = 1) : requis par le path tracer
    this.geo.setAttribute('color', new BufferAttribute(colors, 4))
    this.peelAttr = new BufferAttribute(new Float32Array(pos.count), 1)
    this.geo.setAttribute('aPeel', this.peelAttr)
    const mat = createPotatoMaterial(tex, look, { vertexColors: true, normal: true, fleshScale: 1.6 })
    this.mesh = new Mesh(this.geo, mat)
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
      this.peelAttr.setX(i, peeled ? 1 : 0)
      if (peeled) col.setXYZ(i, 1, 1, 1)
      else col.setXYZ(i, this.skin[i * 3], this.skin[i * 3 + 1], this.skin[i * 3 + 2])
    }
    pos.needsUpdate = true
    col.needsUpdate = true
    this.peelAttr.needsUpdate = true
    this.geo.computeVertexNormals()
    this.geo.computeBoundingSphere()
  }

  /**
   * Path tracing : le shader peau/chair n'est pas supporté, on cuit donc la couleur finale dans les sommets
   * (peau brune variée / chair de la variété) + textures standard.
   */
  enterPathTrace(): void {
    if (this.rasterMaterial) return
    const col = this.geo.getAttribute('color') as BufferAttribute
    const f = this.look.flesh, sk = this.look.skinPiece
    for (let i = 0; i < this.dirs.length; i++) {
      if (this.peel.sample(this.dirs[i])) col.setXYZ(i, f[0] * 0.68, f[1] * 0.68, f[2] * 0.68)
      else col.setXYZ(i, sk[0] * 1.7 * this.skin[i * 3], sk[1] * 1.7 * this.skin[i * 3 + 1], sk[2] * 1.7 * this.skin[i * 3 + 2])
    }
    col.needsUpdate = true
    this.rasterMaterial = this.mesh.material as Material
    this.mesh.material = new MeshPhysicalMaterial({
      vertexColors: true, roughness: 0.75, map: this.tex.flesh, normalMap: this.tex.skinNor, clearcoat: 0.15, clearcoatRoughness: 0.45,
    })
  }

  exitPathTrace(): void {
    if (!this.rasterMaterial) return
    ;(this.mesh.material as MeshStandardMaterial).dispose()
    this.mesh.material = this.rasterMaterial
    this.rasterMaterial = null
    this.refresh()
  }

  dispose(): void {
    this.geo.dispose()
    ;(this.mesh.material as MeshStandardMaterial).dispose()
  }
}
