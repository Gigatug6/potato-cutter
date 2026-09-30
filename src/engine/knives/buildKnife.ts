import {
  AdditiveBlending, BoxGeometry, BufferAttribute, BufferGeometry, CylinderGeometry, ExtrudeGeometry, Group, Mesh,
  MeshStandardMaterial, PointLight, Points, PointsMaterial, Shape,
} from 'three'
import type { BladeType, KnifeDef } from '../../game/data/knives'

const H = 0.5 // hauteur de lame
const L = 1.4 // longueur de lame

function bladeShape(type: BladeType, len: number): Shape {
  const s = new Shape()
  switch (type) {
    case 'couperet':
      s.moveTo(0, 0).lineTo(len, 0).lineTo(len, H * 1.3).lineTo(0, H * 1.3).closePath()
      break
    case 'santoku':
      s.moveTo(0, 0).lineTo(len, 0).lineTo(len, H * 0.6).lineTo(len * 0.8, H).lineTo(0, H).closePath()
      break
    case 'dentele': {
      s.moveTo(0, H)
      s.lineTo(0, 0.05)
      const teeth = 14
      for (let i = 0; i < teeth; i++) {
        s.lineTo(((i + 0.5) / teeth) * len, -0.04)
        s.lineTo(((i + 1) / teeth) * len, 0.05)
      }
      s.lineTo(len, H).closePath()
      break
    }
    case 'courbe':
      s.moveTo(0, 0.1).quadraticCurveTo(len * 0.55, -0.22, len, H * 0.9).lineTo(len * 0.9, H).lineTo(0, H).closePath()
      break
    case 'double':
    case 'chef':
    default:
      s.moveTo(0, 0).lineTo(len * 0.88, 0).quadraticCurveTo(len, H * 0.15, len, H * 0.8).lineTo(len * 0.85, H).lineTo(0, H).closePath()
  }
  return s
}

export interface KnifeObject {
  group: Group
  /** animations continues (lueur, étincelles) */
  update(t: number): void
  dispose(): void
}

/** Couteau procédural. Tranchant vers le bas (-y), lame dans le plan YZ (coupe perpendiculaire à X). */
export function buildKnife(def: KnifeDef): KnifeObject {
  const m = def.model
  const len = L * (m.lengthScale ?? 1)
  const bladeMat = new MeshStandardMaterial({
    color: m.bladeColor, metalness: m.metalness, roughness: m.roughness,
    emissive: m.emissive ?? '#000000', emissiveIntensity: m.emissiveIntensity ?? 0,
  })
  const handleMat = new MeshStandardMaterial({ color: m.handleColor, roughness: 0.7, metalness: 0.1 })
  const disposables: { dispose(): void }[] = [bladeMat, handleMat]

  const inner = new Group() // repère « lame le long de x », orienté ensuite vers z
  const addBlade = (zOffset: number) => {
    const geo = new ExtrudeGeometry(bladeShape(m.blade, len), { depth: 0.04, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 1 })
    disposables.push(geo)
    const mesh = new Mesh(geo, bladeMat)
    mesh.position.z = zOffset
    mesh.castShadow = true
    inner.add(mesh)
  }
  addBlade(0)
  if (m.blade === 'double') addBlade(0.16)

  const hGeo = new CylinderGeometry(0.07, 0.08, 0.7, 12)
  hGeo.rotateZ(Math.PI / 2)
  disposables.push(hGeo)
  const handle = new Mesh(hGeo, handleMat)
  handle.position.set(-0.35, H * 0.55, m.blade === 'double' ? 0.1 : 0.02)
  handle.castShadow = true
  inner.add(handle)
  const guardGeo = new BoxGeometry(0.05, H * 0.9, 0.16)
  disposables.push(guardGeo)
  const guard = new Mesh(guardGeo, handleMat)
  guard.position.set(0.0, H * 0.5, m.blade === 'double' ? 0.1 : 0.02)
  inner.add(guard)

  // longueur (x) → axe z du monde ; épaisseur (z) → axe x du monde
  inner.rotation.y = Math.PI / 2
  inner.position.z = -len / 2 // centré sur la patate
  const group = new Group()
  group.add(inner)

  let light: PointLight | null = null
  if (m.glow) {
    light = new PointLight(m.emissive ?? '#ffffff', 1.2, 4)
    light.position.set(0, H, 0)
    group.add(light)
  }
  let sparkles: Points | null = null
  let sparkPos: Float32Array | null = null
  if (m.sparkles) {
    const n = 30
    sparkPos = new Float32Array(n * 3)
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(sparkPos, 3))
    const mat = new PointsMaterial({ color: '#fff3b0', size: 0.06, transparent: true, blending: AdditiveBlending, depthWrite: false })
    sparkles = new Points(g, mat)
    sparkles.frustumCulled = false
    disposables.push(g, mat)
    group.add(sparkles)
  }

  return {
    group,
    update(t: number) {
      if (m.glow) bladeMat.emissiveIntensity = (m.emissiveIntensity ?? 1) * (0.75 + 0.25 * Math.sin(t * 4))
      if (sparkPos && sparkles) {
        for (let i = 0; i < sparkPos.length / 3; i++) {
          const a = t * 0.8 + i * 2.399
          sparkPos[i * 3] = Math.sin(a * 1.3) * 0.15
          sparkPos[i * 3 + 1] = H * 0.5 + Math.sin(a * 1.7 + i) * H * 0.7
          sparkPos[i * 3 + 2] = Math.cos(a) * len * 0.5
        }
        ;(sparkles.geometry.getAttribute('position') as BufferAttribute).needsUpdate = true
      }
    },
    dispose() {
      disposables.forEach((d) => d.dispose())
      light?.dispose()
    },
  }
}
