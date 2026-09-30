import {
  BoxGeometry, Color, DirectionalLight, Fog, HemisphereLight, Mesh, MeshStandardMaterial, PlaneGeometry, Scene,
} from 'three'
import type { SceneTextures } from './textures'

export const BOARD_TOP = 0.1

/** Décor : planche en bois, sol, lumières. */
export function buildKitchen(scene: Scene, tex: SceneTextures): void {
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
}
