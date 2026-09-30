import { test } from '@playwright/test'
import { api } from '../helpers'

declare const process: { env: Record<string, string | undefined> }

// Outil (pas un test) : génère artifacts/og-raw.png. Lancer avec MAKE_OG=1 ./scripts/e2e.sh og
test.skip(!process.env.MAKE_OG, 'outil de génération de l’image Open Graph')
test.use({ viewport: { width: 1200, height: 630 } })

test('capture Open Graph', async ({ page }) => {
  test.setTimeout(240_000)
  await page.addInitScript(() => {
    localStorage.setItem('potato-cutter:save', JSON.stringify({
      version: 1,
      decorOwned: ['board-marble', 'wall-brick', 'mood-day', 'prop-plant', 'prop-spices', 'prop-candles'],
      decorEquipped: ['board-marble', 'wall-brick', 'mood-day', 'prop-plant', 'prop-spices', 'prop-candles'],
    }))
  })
  await page.goto('/?fx=high')
  await page.waitForFunction(() => (window as any).__potato)
  await api(page, 'startRound', 'rondelles', 42)
  await page.waitForFunction(() => (window as any).__potato.getState().frames > 4, null, { timeout: 90_000 })
  await page.waitForTimeout(3000)
  await api(page, 'peelAll')
  await api(page, 'goToCutting')
  await page.waitForTimeout(1500)
  for (const p of [-0.95, -0.6, -0.25, 0.1, 0.45, 0.8]) await api(page, 'cutAt', 'x', p)
  await page.waitForTimeout(2500)
  await page.addStyleTag({ content: '.overlay, .photo-ui, .floaters { display: none !important; }' })
  await page.evaluate(() => {
    const d = document.createElement('div')
    d.style.cssText = 'position:fixed;left:0;right:0;bottom:0;padding:26px 48px;background:linear-gradient(transparent,rgba(30,15,0,.82));color:#fff;font-family:system-ui,sans-serif;z-index:9'
    d.innerHTML = '<div style="font-size:60px;font-weight:900;letter-spacing:-1px">🥔 Potato Cutter</div><div style="font-size:28px;opacity:.95;margin-top:4px">Simulateur 3D de découpe de patates · ray tracing · couteaux rares · décors</div>'
    document.body.appendChild(d)
  })
  await page.screenshot({ path: 'artifacts/og-raw.png' })
})
