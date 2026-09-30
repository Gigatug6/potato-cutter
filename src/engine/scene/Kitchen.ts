import {
  BoxGeometry, Color, DirectionalLight, Fog, HemisphereLight, Mesh, MeshStandardMaterial, PlaneGeometry, Scene,
} from 'three'

export const BOARD_TOP = 0.1

/** Décor : planche en bois, sol, lumières. */
export function buildKitchen(scene: Scene): void {
  scene.background = new Color('#f4e3c8')
  scene.fog = new Fog('#f4e3c8', 12, 28)

  scene.add(new HemisphereLight('#fff6e5', '#8a6a4a', 1.1))
  const sun = new DirectionalLight('#fffbe8', 2.2)
  sun.position.set(3, 7, 4)
  sun.castShadow = true
  sun.shadow.mapSize.set(1024, 1024)
  sun.shadow.camera.left = -5; sun.shadow.camera.right = 5
  sun.shadow.camera.top = 5; sun.shadow.camera.bottom = -5
  sun.shadow.bias = -0.0005
  scene.add(sun)

  const board = new Mesh(new BoxGeometry(7, 0.2, 4.4), new MeshStandardMaterial({ color: '#b07b48', roughness: 0.8 }))
  board.receiveShadow = true
  scene.add(board)

  const floor = new Mesh(new PlaneGeometry(60, 60), new MeshStandardMaterial({ color: '#e8d2ad', roughness: 1 }))
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.11
  floor.receiveShadow = true
  scene.add(floor)
}
