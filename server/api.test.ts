import { mkdtemp, rm } from 'node:fs/promises'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApi } from './index.ts'
import { RateLimiter, validCode, validSavePayload } from './store.ts'

let dir = ''
let base = ''
let close: () => Promise<void>
const CODE = 'ABCDEFGH23456727'.slice(0, 16)

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'potato-'))
  const server = createApi(dir, new RateLimiter(1000))
  await new Promise<void>((r) => server.listen(0, r))
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  close = () => new Promise((r) => server.close(() => r()))
})
afterAll(async () => { await close(); await rm(dir, { recursive: true, force: true }) })

const put = (code: string, body: unknown) => fetch(`${base}/api/save/${code}`, { method: 'PUT', body: typeof body === 'string' ? body : JSON.stringify(body) })

describe('validation', () => {
  it('codes : 16 caractères base32 majuscules', () => {
    expect(validCode(CODE)).toBe(true)
    expect(validCode('abc')).toBe(false)
    expect(validCode('ABCDEFGH1234567!')).toBe(false)
    expect(validCode('../../etc/passwd')).toBe(false)
  })
  it('payload : objet avec version 1', () => {
    expect(validSavePayload({ version: 1 })).toBe(true)
    expect(validSavePayload({ version: 2 })).toBe(false)
    expect(validSavePayload([])).toBe(false)
    expect(validSavePayload(null)).toBe(false)
  })
  it('limiteur de débit', () => {
    const l = new RateLimiter(3, 1000)
    expect([1, 2, 3, 4].map(() => l.allow('ip', 0))).toEqual([true, true, true, false])
    expect(l.allow('ip', 2000)).toBe(true) // nouvelle fenêtre
    expect(l.allow('autre', 0)).toBe(true)
  })
})

describe('API HTTP', () => {
  it('santé', async () => expect((await (await fetch(`${base}/api/health`)).json()).ok).toBe(true))
  it('PUT puis GET : aller-retour', async () => {
    const r = await put(CODE, { version: 1, money: 123 })
    expect(r.status).toBe(200)
    const g = await fetch(`${base}/api/save/${CODE}`)
    expect(g.status).toBe(200)
    expect(g.headers.get('cache-control')).toBe('no-store')
    const j = await g.json()
    expect(j.save.money).toBe(123)
    expect(typeof j.updatedAt).toBe('string')
  })
  it('code inconnu → 404, code invalide → 400', async () => {
    expect((await fetch(`${base}/api/save/ZZZZZZZZZZZZZZZZ`)).status).toBe(404)
    expect((await fetch(`${base}/api/save/trop-court`)).status).toBe(400)
  })
  it('corps invalides rejetés', async () => {
    expect((await put(CODE, '{pas du json')).status).toBe(400)
    expect((await put(CODE, { version: 9 })).status).toBe(400)
    expect((await put(CODE, { version: 1, pad: 'x'.repeat(70_000) })).status).toBe(413)
  })
  it('méthode non supportée → 405, route inconnue → 404', async () => {
    expect((await fetch(`${base}/api/save/${CODE}`, { method: 'DELETE' })).status).toBe(405)
    expect((await fetch(`${base}/nope`)).status).toBe(404)
  })
})
