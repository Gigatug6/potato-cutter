import { HalfFloatType, type Camera, type Scene, type WebGLRenderer } from 'three'
import {
  BloomEffect, DepthOfFieldEffect, EffectComposer, EffectPass, RenderPass, SMAAEffect, ToneMappingEffect, ToneMappingMode, VignetteEffect,
} from 'postprocessing'
import { N8AOPostPass } from 'n8ao'
import type { Quality } from '../../game/save/saveSchema'

/**
 * Chaîne de post-traitement « cinéma » : occlusion ambiante N8AO (contact shadows), bloom HDR,
 * tone mapping ACES, vignette, SMAA ; en ultra : profondeur de champ (bokeh) et AO haute qualité.
 */
export class PostFx {
  readonly composer: EffectComposer
  private readonly ao: N8AOPostPass
  private readonly bloom: BloomEffect
  private readonly dof: DepthOfFieldEffect | null

  constructor(renderer: WebGLRenderer, scene: Scene, camera: Camera, quality: Exclude<Quality, 'low'>, w: number, h: number) {
    const ultra = quality === 'ultra'
    this.composer = new EffectComposer(renderer, { frameBufferType: HalfFloatType })
    this.composer.addPass(new RenderPass(scene, camera))

    this.ao = new N8AOPostPass(scene, camera, w, h)
    this.ao.configuration.aoRadius = 0.85
    this.ao.configuration.distanceFalloff = 1.1
    this.ao.configuration.intensity = ultra ? 3.6 : 2.8
    this.ao.setQualityMode(ultra ? 'High' : 'Medium')
    this.composer.addPass(this.ao)

    this.bloom = new BloomEffect({ intensity: 0.4, luminanceThreshold: 0.88, luminanceSmoothing: 0.25, mipmapBlur: true, radius: 0.75 })
    const tone = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC })
    const vignette = new VignetteEffect({ offset: 0.28, darkness: 0.5 })
    this.dof = ultra ? new DepthOfFieldEffect(camera as never, { worldFocusDistance: 6, worldFocusRange: 3.2, bokehScale: 2.4, resolutionScale: 0.5 }) : null
    const effects = [this.bloom, ...(this.dof ? [this.dof] : []), tone, vignette]
    this.composer.addPass(new EffectPass(camera as never, ...effects))
    this.composer.addPass(new EffectPass(camera as never, new SMAAEffect()))
  }

  setBloom(intensity: number): void {
    this.bloom.intensity = intensity
  }

  /** Distance caméra → patate : la mise au point suit l'orbite. */
  setFocus(distance: number): void {
    if (this.dof) this.dof.circleOfConfusionMaterial.worldFocusDistance = distance
  }

  setSize(w: number, h: number): void {
    this.composer.setSize(w, h, false)
    this.ao.setSize(w, h)
  }

  render(dt: number): void {
    this.composer.render(dt)
  }

  dispose(): void {
    this.composer.dispose()
  }
}
