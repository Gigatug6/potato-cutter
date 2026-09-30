import { test, expect } from '@playwright/test'

declare const process: { env: Record<string, string | undefined> }

// Vérifie le build « GitHub Pages » (sous-dossier, sans API). Lancé par : PAGES_TEST=1 (voir scripts/pages-check.sh)
test.skip(!process.env.PAGES_TEST, 'test du build GitHub Pages (sous-dossier)')

test('build GitHub Pages : chargement sous /potato-cutter/, aucune ressource 404, sans API', async ({ page }) => {
  test.setTimeout(120_000)
  const failed: string[] = []
  const errors: string[] = []
  page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`) })
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

  await page.goto('./')
  await page.waitForFunction(() => (window as any).__potato, null, { timeout: 60_000 })
  await expect(page).toHaveTitle(/Potato Cutter/)
  expect(page.url()).toContain('/potato-cutter/')
  await page.waitForFunction(() => (window as any).__potato.getState().frames > 5)
  await page.waitForTimeout(2500) // textures, HDRI, KTX2 (sous-dossier)
  await expect.poll(async () => (await page.evaluate(() => (window as any).__potato.getState().ktx2))).toBeGreaterThanOrEqual(1)

  // manifest, icônes, sitemap, robots : résolus sous le sous-dossier
  const base = new URL('./', page.url()).href
  for (const f of ['manifest.webmanifest', 'icons/icon-192.png', 'favicon.svg', 'og-image.jpg', 'robots.txt', 'sitemap.xml', 'sw.js']) {
    const r = await page.request.get(base + f)
    expect(r.ok(), f).toBe(true)
  }
  expect(await (await page.request.get(base + 'sitemap.xml')).text()).toContain('https://exemple.github.io/potato-cutter/')

  // l'API n'existe pas sur Pages : la section « sauvegarde en ligne » est masquée, l'export fichier reste
  await page.evaluate(() => (window as any).__potato.getState())
  await page.getByTestId('nav-settings').click()
  await expect(page.getByTestId('static-note')).toBeVisible()
  await expect(page.getByTestId('cloud-create')).toHaveCount(0)
  await expect(page.getByTestId('file-export')).toBeVisible()

  expect(failed.filter((f) => !/favicon\.ico/.test(f))).toEqual([])
  expect(errors).toEqual([])
})
