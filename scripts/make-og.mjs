// artifacts/og-raw.png → public/og-image.jpg (1200×630, JPEG optimisé)
import sharp from 'sharp'

const info = await sharp('artifacts/og-raw.png').resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 82, mozjpeg: true }).toFile('public/og-image.jpg')
console.log(`og-image.jpg ${(info.size / 1024).toFixed(0)} Ko`)
