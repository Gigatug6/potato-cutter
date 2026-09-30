import { WebGLPathTracer } from 'three-gpu-pathtracer'
import type { Camera, Scene, WebGLRenderer } from 'three'

/** Vrai path tracing GPU (three-gpu-pathtracer) : accumulation progressive d'échantillons, éclairage global, reflets, transmission. */
export class PathTraceSession {
  private readonly pt: WebGLPathTracer

  static supported(renderer: WebGLRenderer): boolean {
    return renderer.capabilities.isWebGL2 && renderer.extensions.has('EXT_color_buffer_float')
  }

  constructor(renderer: WebGLRenderer, scene: Scene, camera: Camera, opts: { scale: number; bounces: number }) {
    this.pt = new WebGLPathTracer(renderer)
    this.pt.bounces = opts.bounces
    this.pt.transmissiveBounces = 4
    this.pt.renderScale = opts.scale
    this.pt.filterGlossyFactor = 0.4
    this.pt.tiles.set(2, 2)
    this.pt.dynamicLowRes = true
    this.pt.lowResScale = 0.3
    this.pt.setScene(scene, camera)
  }

  get samples(): number {
    return this.pt.samples
  }

  get compiling(): boolean {
    return Boolean((this.pt as unknown as { isCompiling?: boolean }).isCompiling)
  }

  /** À appeler à chaque frame ; `moved` remet l'accumulation à zéro. */
  frame(moved: boolean): void {
    if (moved) this.pt.updateCamera()
    this.pt.renderSample()
  }

  /** WebGLPathTracer.dispose() (0.0.23) référence `_renderQuad` inexistant : on libère les ressources internes nous-mêmes. */
  dispose(): void {
    const a = this.pt as unknown as Record<string, { dispose?: () => void; material?: { dispose?: () => void } } | undefined>
    for (const fn of [() => a._quad?.dispose?.(), () => a._quad?.material?.dispose?.(), () => a._pathTracer?.dispose?.(), () => a._lowResPathTracer?.dispose?.()]) {
      try { fn() } catch { /* ressource déjà libérée */ }
    }
  }
}
