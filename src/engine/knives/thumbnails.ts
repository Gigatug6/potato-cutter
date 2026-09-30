import { AmbientLight, DirectionalLight, PerspectiveCamera, Scene, WebGLRenderer, type Texture } from 'three'
import type { KnifeDef } from '../../game/data/knives'
import { createEnvironment } from '../scene/env'
import { buildKnife } from './buildKnife'

let renderer: WebGLRenderer | null = null
let env: Texture | null = null
const cache = new Map<string, string>()

/** Vignette (dataURL) d'un couteau, rendue par un unique renderer partagé. '' si WebGL indisponible. */
export function knifeThumbnail(def: KnifeDef): string {
  const hit = cache.get(def.id)
  if (hit !== undefined) return hit
  let url = ''
  try {
    renderer ??= new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
    renderer.setSize(280, 140, false)
    renderer.setClearColor(0x000000, 0)
    env ??= createEnvironment(renderer)
    const scene = new Scene()
    scene.environment = env
    scene.add(new AmbientLight('#ffffff', 1.4))
    const sun = new DirectionalLight('#ffffff', 2.4)
    sun.position.set(3, 3, 2)
    scene.add(sun)
    const knife = buildKnife(def)
    knife.update(1)
    scene.add(knife.group)
    const cam = new PerspectiveCamera(32, 2, 0.1, 50)
    cam.position.set(4.6, 0.5, 0.35)
    cam.lookAt(0, 0.3, 0.35)
    renderer.render(scene, cam)
    url = renderer.domElement.toDataURL('image/png')
    knife.dispose()
  } catch {
    url = ''
  }
  cache.set(def.id, url)
  return url
}
