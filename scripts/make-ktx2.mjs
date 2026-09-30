// Génère les textures GPU compressées (KTX2/Basis Universal, avec mipmaps) à partir des WebP de public/ et copie le transcodeur Basis.
//  - couleurs (_diff) : ETC1S sRGB (qualité 190)          - normales (_nor) : ETC1S linéaire, qualité plus haute (200) ; UASTC serait 2-3x plus lourd
// Usage : docker compose run --rm app node scripts/make-ktx2.mjs
import { copyFile, mkdir, readdir, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { encodeToKTX2 } from 'ktx2-encoder'
import sharp from 'sharp'

const imageDecoder = async (buf) => {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data: new Uint8Array(data), width: info.width, height: info.height }
}

let webp = 0
let ktx = 0
for (const dir of ['public/textures', 'public/decor']) {
  for (const f of await readdir(dir)) {
    if (!f.endsWith('.webp')) continue
    const src = join(dir, f)
    const normal = f.includes('_nor')
    const png = await sharp(src).png().toBuffer()
    const out = await encodeToKTX2(new Uint8Array(png), normal
      ? { isUASTC: false, qualityLevel: 200, generateMipmap: true, imageDecoder, enableDebug: false }
      : { isUASTC: false, isSetKTX2SRGBTransferFunc: true, qualityLevel: 190, generateMipmap: true, imageDecoder, enableDebug: false })
    const dst = src.replace(/\.webp$/, '.ktx2')
    await writeFile(dst, out)
    webp += (await stat(src)).size
    ktx += out.length
    console.log(`${f} → ${dst.split('/').pop()} (${(out.length / 1024).toFixed(0)} Ko)`)
  }
}
console.log(`WebP ${(webp / 1e6).toFixed(1)} Mo → KTX2 ${(ktx / 1e6).toFixed(1)} Mo (+ mipmaps, VRAM ×4-8 plus petite si GPU compressé)`)

await mkdir('public/basis', { recursive: true })
for (const f of ['basis_transcoder.js', 'basis_transcoder.wasm']) await copyFile(`node_modules/three/examples/jsm/libs/basis/${f}`, `public/basis/${f}`)
console.log('transcodeur Basis copié dans public/basis/')
