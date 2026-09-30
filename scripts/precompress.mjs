// Précompresse dist/ en Brotli (q11) et gzip (9) : Caddy sert les .br/.gz directement (aucun coût CPU à la requête).
// Usage : node scripts/precompress.mjs [dossier]
import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { brotliCompressSync, constants, gzipSync } from 'node:zlib'

const EXT = /\.(js|css|html|svg|json|webmanifest|xml|txt|hdr|map|wasm)$/
const MIN = 1024
const root = process.argv[2] ?? 'dist'
let raw = 0, br = 0, files = 0

async function walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) { await walk(p); continue }
    if (!EXT.test(e.name) || (await stat(p)).size < MIN) continue
    const buf = await readFile(p)
    const b = brotliCompressSync(buf, { params: { [constants.BROTLI_PARAM_QUALITY]: 11, [constants.BROTLI_PARAM_SIZE_HINT]: buf.length } })
    await writeFile(`${p}.br`, b)
    await writeFile(`${p}.gz`, gzipSync(buf, { level: 9 }))
    raw += buf.length; br += b.length; files++
  }
}
await walk(root)
console.log(`${files} fichiers précompressés : ${(raw / 1024).toFixed(0)} Ko → ${(br / 1024).toFixed(0)} Ko (brotli)`)
