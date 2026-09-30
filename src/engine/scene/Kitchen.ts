import {
  BoxGeometry, Color, DirectionalLight, Fog, HemisphereLight, Mesh, MeshStandardMaterial, PlaneGeometry, Scene,
} from 'three'
import { Group, Vector3 } from 'three'
import type { SceneTextures } from './textures'

export const BOARD_TOP = 0.1

export const FRYER_POS = new Vector3(2.15, BOARD_TOP, -0.5)

/** Décor : planche en bois, sol, lumières, friteuse. Renvoie le point de chute (monde) dans la friteuse. */
export function buildKitchen(scene: Scene, tex: SceneTextures): Vector3 {
  scene.background = new Color('#cdb48f')
  scene.fog = new Fog('#cdb48f', 25, 55)

  scene.add(new HemisphereLight('#fff6e5', '#8a6a4a', 0.7))
  const sun = new DirectionalLight('#fffbe8', 1.7)
  sun.position.set(3, 7, 4)
  sun.castShadow = true
  sun.shadow.mapSize.set(1024, 1024)
  sun.shadow.camera.left = -5; sun.shadow.camera.right = 5
  sun.shadow.camera.top = 5; sun.shadow.camera.bottom = -5
  sun.shadow.bias = -0.0005
  scene.add(sun)

  const board = new Mesh(new BoxGeometry(7, 0.2, 4.4), new MeshStandardMaterial({ map: tex.woodDiff, normalMap: tex.woodNor, roughness: 0.75, color: new Color(1.6, 1.5, 1.4) }))
  board.receiveShadow = true
  scene.add(board)

  const floor = new Mesh(new PlaneGeometry(60, 60), new MeshStandardMaterial({ color: '#a88c64', roughness: 1 }))
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.11
  floor.receiveShadow = true
  scene.add(floor)

  // friteuse : bac métallique + huile
  const fryer = new Group()
  const steel = new MeshStandardMaterial({ color: '#9aa0a6', metalness: 0.9, roughness: 0.35 })
  const W = 1.15, H = 0.6, D = 1.15, T = 0.07
  const walls: [number, number, number, number, number, number][] = [
    [W, H, T, 0, H / 2, D / 2], [W, H, T, 0, H / 2, -D / 2], [T, H, D, W / 2, H / 2, 0], [T, H, D, -W / 2, H / 2, 0], [W, T, D, 0, T / 2, 0],
  ]
  for (const [w, h, d, x, y, z] of walls) {
    const m = new Mesh(new BoxGeometry(w, h, d), steel)
    m.position.set(x, y, z)
    m.castShadow = true
    fryer.add(m)
  }
  const oil = new Mesh(new PlaneGeometry(W - 2 * T, D - 2 * T), new MeshStandardMaterial({ color: '#b5650d', roughness: 0.12, metalness: 0.3, emissive: '#5a2a00', emissiveIntensity: 0.25 }))
  oil.rotation.x = -Math.PI / 2
  oil.position.y = H * 0.72
  fryer.add(oil)
  const handle = new Mesh(new BoxGeometry(0.7, 0.05, 0.07), new MeshStandardMaterial({ color: '#2b2b2b', roughness: 0.6 }))
  handle.position.set(0, H * 0.9, D / 2 + 0.25)
  fryer.add(handle)
  fryer.position.copy(FRYER_POS)
  scene.add(fryer)
  return new Vector3(FRYER_POS.x, FRYER_POS.y + H * 0.85, FRYER_POS.z)
}
