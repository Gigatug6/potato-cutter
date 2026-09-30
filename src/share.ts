/** Partage d'une capture : filigrane « Potato Cutter », Web Share (mobile) sinon téléchargement PNG. */

export function captureFileName(date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `potato-cutter-${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}-${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}.png`
}

async function withWatermark(dataUrl: string): Promise<Blob> {
  const img = new Image()
  img.src = dataUrl
  await img.decode()
  const c = document.createElement('canvas')
  c.width = img.width
  c.height = img.height
  const ctx = c.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  const h = Math.max(36, Math.round(img.height * 0.07))
  const g = ctx.createLinearGradient(0, img.height - h * 1.6, 0, img.height)
  g.addColorStop(0, 'rgba(30,15,0,0)')
  g.addColorStop(1, 'rgba(30,15,0,0.7)')
  ctx.fillStyle = g
  ctx.fillRect(0, img.height - h * 1.6, img.width, h * 1.6)
  ctx.fillStyle = '#fff'
  ctx.font = `800 ${Math.round(h * 0.55)}px system-ui, sans-serif`
  ctx.textBaseline = 'middle'
  ctx.fillText('🥔 Potato Cutter', Math.round(h * 0.4), img.height - h * 0.6)
  return await new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('capture impossible'))), 'image/png'))
}

/** Renvoie 'shared' (feuille de partage native) ou 'downloaded'. */
export async function shareCapture(dataUrl: string, text = 'Regarde ma patate ! 🥔'): Promise<'shared' | 'downloaded'> {
  const blob = await withWatermark(dataUrl)
  const file = new File([blob], captureFileName(), { type: 'image/png' })
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.canShare?.({ files: [file] }) && nav.share) {
    try {
      await nav.share({ files: [file], title: 'Potato Cutter', text, url: window.location.origin })
      return 'shared'
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return 'shared' // l'utilisateur a fermé la feuille
    }
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = file.name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
  return 'downloaded'
}
