import { RepeatWrapping, type Material, type Scene, type Texture, type WebGLRenderer } from 'three'
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js'

/**
 * Textures GPU compressées (KTX2 / Basis Universal, mipmaps inclus) : on démarre avec le WebP (rapide à afficher), puis on
 * « monte en gamme » en arrière-plan vers le KTX2 (VRAM ×4-8 plus petite sur GPU compatibles, envoi plus rapide) ; repli = le WebP.
 */
export class Ktx2Upgrader {
  private readonly loader: KTX2Loader

  constructor(renderer: WebGLRenderer, private readonly scene: Scene) {
    this.loader = new KTX2Loader().setTranscoderPath(`${import.meta.env.BASE_URL}basis/`).detectSupport(renderer)
  }

  /** `old` : texture WebP déjà utilisée ; `url` : équivalent .ktx2 ; `done` reçoit la texture compressée. */
  upgrade(old: Texture, url: string, done?: (t: Texture) => void): void {
    this.loader.loadAsync(url).then((t) => {
      t.wrapS = t.wrapT = RepeatWrapping
      t.anisotropy = old.anisotropy
      // les textures compressées ne sont pas retournées verticalement à l'envoi : on compense par l'UV (répétition négative)
      t.repeat.set(old.repeat.x, -old.repeat.y)
      this.replace(old, t)
      done?.(t)
      old.dispose()
    }).catch(() => { /* KTX2 indisponible : on garde le WebP */ })
  }

  private replace(old: Texture, next: Texture): void {
    this.scene.traverse((o) => {
      const mat = (o as { material?: Material | Material[] }).material
      if (!mat) return
      for (const m of Array.isArray(mat) ? mat : [mat]) {
        const mm = m as Material & { map?: Texture | null; normalMap?: Texture | null }
        if (mm.map === old) mm.map = next
        if (mm.normalMap === old) mm.normalMap = next
      }
    })
  }

  /** Nombre de textures compressées actuellement utilisées par la scène (debug/tests). */
  count(): number {
    const set = new Set<Texture>()
    this.scene.traverse((o) => {
      const mat = (o as { material?: Material | Material[] }).material
      if (!mat) return
      for (const m of Array.isArray(mat) ? mat : [mat]) {
        const mm = m as Material & { map?: Texture | null; normalMap?: Texture | null }
        for (const t of [mm.map, mm.normalMap]) if (t && (t as { isCompressedTexture?: boolean }).isCompressedTexture) set.add(t)
      }
    })
    return set.size
  }

  dispose(): void {
    this.loader.dispose()
  }
}
