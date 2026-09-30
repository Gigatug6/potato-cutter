import { CanvasTexture, RepeatWrapping, SRGBColorSpace, TextureLoader, type Texture, type WebGLRenderer } from 'three'

/** Textures de base (clé → fichier sans extension) ayant un équivalent .ktx2. */
export const KTX_FILES: Partial<Record<keyof SceneTextures, string>> = {
  woodDiff: 'wood_table_001_diff', woodNor: 'wood_table_001_nor', skinDiff: 'brown_mud_02_diff', skinNor: 'brown_mud_02_nor',
  metalDiff: 'metal_diff', metalNor: 'metal_nor',
}

export interface SceneTextures {
  woodDiff: Texture; woodNor: Texture; skinDiff: Texture; skinNor: Texture
  metalDiff: Texture; metalNor: Texture
  /** chair de patate (niveaux de gris, procédurale) */
  flesh: Texture
}

/** Bruit de valeur périodique (tuilable) : octaves sommées. */
function tileableNoise(size: number, seed: number): Float32Array {
  const out = new Float32Array(size * size)
  let st = seed >>> 0
  const rnd = () => { st = (Math.imul(st, 1664525) + 1013904223) >>> 0; return st / 4294967296 }
  let amp = 1, total = 0
  for (const period of [4, 8, 16, 32]) {
    const grid = Array.from({ length: period * period }, rnd)
    const at = (x: number, y: number) => grid[((y % period) + period) % period * period + ((x % period) + period) % period]
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const fx = (x / size) * period, fy = (y / size) * period
        const x0 = Math.floor(fx), y0 = Math.floor(fy)
        const tx = fx - x0, ty = fy - y0
        const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty)
        const v = at(x0, y0) * (1 - sx) * (1 - sy) + at(x0 + 1, y0) * sx * (1 - sy) + at(x0, y0 + 1) * (1 - sx) * sy + at(x0 + 1, y0 + 1) * sx * sy
        out[y * size + x] += v * amp
      }
    total += amp
    amp *= 0.55
  }
  for (let i = 0; i < out.length; i++) out[i] /= total
  return out
}

/** Chair de patate : nuages amidonnés, petites taches, cernes vasculaires. Valeurs ~0.75–1 (multipliées par la couleur de chair). */
export function createFleshTexture(): Texture {
  const size = 256
  const n = tileableNoise(size, 1234)
  const n2 = tileableNoise(size, 98765)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(size, size)
  for (let i = 0; i < size * size; i++) {
    const y = Math.floor(i / size), x = i % size
    const rings = 0.5 + 0.5 * Math.sin((n2[i] * 9 + (x + y) / size * 2) * Math.PI * 2)
    let v = 0.82 + (n[i] - 0.5) * 0.6 + (rings - 0.5) * 0.14
    if (n2[i] > 0.7) v -= (n2[i] - 0.7) * 1.3 // taches
    const g = Math.max(0, Math.min(255, Math.round(v * 255)))
    img.data[i * 4] = g; img.data[i * 4 + 1] = g; img.data[i * 4 + 2] = Math.max(0, g - 6); img.data[i * 4 + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  const t = new CanvasTexture(canvas)
  t.wrapS = t.wrapT = RepeatWrapping
  return t
}

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
    woodDiff: load('wood_table_001_diff.webp', true, 2, 1.3),
    woodNor: load('wood_table_001_nor.webp', false, 2, 1.3),
    skinDiff: load('brown_mud_02_diff.webp', true, 3, 2),
    skinNor: load('brown_mud_02_nor.webp', false, 3, 2),
    metalDiff: load('metal_diff.webp', true, 1, 1),
    metalNor: load('metal_nor.webp', false, 1, 1),
    flesh: createFleshTexture(),
  }
  return cache
}
