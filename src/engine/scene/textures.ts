import { RepeatWrapping, SRGBColorSpace, TextureLoader, type Texture, type WebGLRenderer } from 'three'

export interface SceneTextures { woodDiff: Texture; woodNor: Texture; skinDiff: Texture; skinNor: Texture }

let cache: SceneTextures | null = null

/** Textures CC0 (Poly Haven) servies depuis /textures. Partagées entre les manches. */
export function loadTextures(renderer: WebGLRenderer): SceneTextures {
  if (cache) return cache
  const loader = new TextureLoader()
  const base = `${import.meta.env.BASE_URL}textures/`
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy())
  const load = (file: string, srgb: boolean, rx: number, ry: number): Texture => {
    const t = loader.load(base + file)
    t.wrapS = t.wrapT = RepeatWrapping
    t.repeat.set(rx, ry)
    t.anisotropy = aniso
    if (srgb) t.colorSpace = SRGBColorSpace
    return t
  }
  cache = {
    woodDiff: load('wood_table_001_diff.jpg', true, 2, 1.3),
    woodNor: load('wood_table_001_nor.jpg', false, 2, 1.3),
    skinDiff: load('brown_mud_02_diff.jpg', true, 3, 2),
    skinNor: load('brown_mud_02_nor.jpg', false, 3, 2),
  }
  return cache
}
