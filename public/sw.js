/* Service worker minimal : jeu jouable hors-ligne après une première visite, rechargements instantanés.
 * - /assets/* (noms hachés)          : cache d'abord
 * - textures, décors, HDRI, icônes   : stale-while-revalidate
 * - navigation                       : réseau d'abord, repli sur la version en cache */
const VERSION = 'v1'
const CACHE = `potato-${VERSION}`
const STATIC_PREFIXES = ['/textures/', '/decor/', '/hdri/', '/icons/']

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('potato-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  )
})

async function cacheFirst(req) {
  const cache = await caches.open(CACHE)
  const hit = await cache.match(req)
  if (hit) return hit
  const res = await fetch(req)
  if (res.ok) cache.put(req, res.clone())
  return res
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE)
  const hit = await cache.match(req)
  const net = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res }).catch(() => hit)
  return hit || net
}

async function networkFirst(req) {
  const cache = await caches.open(CACHE)
  try {
    const res = await fetch(req)
    if (res.ok) cache.put('/index.html', res.clone())
    return res
  } catch {
    return (await cache.match('/index.html')) || Response.error()
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  if (req.mode === 'navigate') event.respondWith(networkFirst(req))
  else if (url.pathname.startsWith('/assets/')) event.respondWith(cacheFirst(req))
  else if (STATIC_PREFIXES.some((p) => url.pathname.startsWith(p))) event.respondWith(staleWhileRevalidate(req))
})
