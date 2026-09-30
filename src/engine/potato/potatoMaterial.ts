import { MeshStandardMaterial, Vector3 } from 'three'
import type { Vec3 } from '../../game/potato/potatoShape'
import type { SceneTextures } from '../scene/textures'

export interface PotatoLook { skinTint: Vec3; flesh: Vec3; skinPiece: Vec3 }

/**
 * Matériau peau/chair : l'attribut de sommet `aPeel` (0 = peau, 1 = chair) mélange la texture de peau
 * (brown_mud_02, réchauffée) et la texture de chair procédurale teintée par la couleur de la variété.
 */
export function createPotatoMaterial(
  tex: SceneTextures,
  look: PotatoLook,
  opts: { vertexColors: boolean; normal: boolean; fleshScale: number },
): MeshStandardMaterial {
  const mat = new MeshStandardMaterial({
    vertexColors: opts.vertexColors, roughness: 0.9, map: tex.skinDiff, normalMap: opts.normal ? tex.skinNor : null,
  })
  if (opts.normal) mat.normalScale.set(1.2, 1.2)
  const flesh = new Vector3(...look.flesh)
  const skinTint = new Vector3(...look.skinTint)
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uFlesh = { value: flesh }
    sh.uniforms.uSkinTint = { value: skinTint }
    sh.uniforms.uFleshMap = { value: tex.flesh }
    sh.uniforms.uFleshScale = { value: opts.fleshScale }
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aPeel;\nvarying float vPeel;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPeel = aPeel;')
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vPeel;\nuniform vec3 uFlesh;\nuniform vec3 uSkinTint;\nuniform sampler2D uFleshMap;\nuniform float uFleshScale;')
      .replace('#include <map_fragment>', `
        vec3 skinC = texture2D( map, vMapUv ).rgb * uSkinTint;
        vec3 fleshC = texture2D( uFleshMap, vMapUv * uFleshScale ).rgb * uFlesh * 0.9;
        diffuseColor.rgb *= mix( skinC, fleshC, smoothstep( 0.35, 0.65, vPeel ) );`)
  }
  return mat
}
