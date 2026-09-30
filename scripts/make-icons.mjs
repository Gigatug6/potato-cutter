// Génère les icônes PNG (PWA, apple-touch) à partir de public/favicon.svg.
// Usage : docker compose run --rm app node scripts/make-icons.mjs
import { mkdir, readFile } from 'node:fs/promises'
import sharp from 'sharp'

const svg = await readFile('public/favicon.svg')
await mkdir('public/icons', { recursive: true })
const out = (name, size, pad = 0) =>
  sharp(svg, { density: 384 })
    .resize(size - pad * 2, size - pad * 2)
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: '#f4e3c8' })
    .png({ compressionLevel: 9 })
    .toFile(`public/icons/${name}`)
await out('icon-192.png', 192)
await out('icon-512.png', 512)
await out('icon-maskable-512.png', 512, 64) // marge de sécurité pour les masques adaptatifs
await out('apple-touch-icon.png', 180)
console.log('icônes générées')
