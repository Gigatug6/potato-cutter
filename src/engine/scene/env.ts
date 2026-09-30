import { PMREMGenerator, type Texture, type WebGLRenderer } from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

/** Carte d'environnement (reflets) pour les matériaux métalliques. À disposer avec texture.dispose(). */
export function createEnvironment(renderer: WebGLRenderer): Texture {
  const pmrem = new PMREMGenerator(renderer)
  const room = new RoomEnvironment()
  const tex = pmrem.fromScene(room, 0.04).texture
  room.dispose()
  pmrem.dispose()
  return tex
}
