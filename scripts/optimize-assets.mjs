// Convertit les textures JPEG de public/ en WebP (≈ 3-5x plus léger) puis supprime les JPEG. Idempotent.
// Usage : docker compose run --rm app node scripts/optimize-assets.mjs
import { readdir, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

const dirs = ['public/textures', 'public/decor']
let before = 0
let after = 0
for (const dir of dirs) {
  for (const f of await readdir(dir)) {
    if (!f.endsWith('.jpg')) continue
    const src = join(dir, f)
    const dst = src.replace(/\.jpg$/, '.webp')
    const normal = f.includes('_nor')
    before += (await stat(src)).size
    await sharp(src).resize(normal ? 512 : 1024, normal ? 512 : 1024, { fit: 'inside' }).webp({ quality: normal ? 88 : 80, effort: 5 }).toFile(dst)
    after += (await stat(dst)).size
    await rm(src)
    console.log(`${f} → ${dst.split('/').pop()}`)
  }
}
console.log(`JPEG ${(before / 1e6).toFixed(1)} Mo → WebP ${(after / 1e6).toFixed(1)} Mo`)
