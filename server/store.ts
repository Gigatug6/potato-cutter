import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

/** Stockage des sauvegardes : un fichier JSON par code de synchronisation (aucun compte, aucune donnée personnelle). */

export const CODE_RE = /^[A-Z2-7]{16}$/
export const MAX_BYTES = 64 * 1024

export const validCode = (c: unknown): c is string => typeof c === 'string' && CODE_RE.test(c)

/** Vérifie qu'un corps JSON ressemble à une sauvegarde du jeu (la validation fine est refaite côté client par parseSave). */
export function validSavePayload(body: unknown): body is Record<string, unknown> {
  return typeof body === 'object' && body !== null && !Array.isArray(body) && (body as { version?: unknown }).version === 1
}

export interface Stored { save: Record<string, unknown>; updatedAt: string }

export class SaveStore {
  private readonly dir: string

  constructor(dir: string) {
    this.dir = dir
  }

  private path(code: string): string {
    return join(this.dir, `${code}.json`)
  }

  async write(code: string, save: Record<string, unknown>): Promise<Stored> {
    await mkdir(this.dir, { recursive: true })
    const stored: Stored = { save, updatedAt: new Date().toISOString() }
    const tmp = `${this.path(code)}.tmp`
    await writeFile(tmp, JSON.stringify(stored), 'utf8')
    await rename(tmp, this.path(code)) // écriture atomique
    return stored
  }

  async read(code: string): Promise<Stored | null> {
    try {
      return JSON.parse(await readFile(this.path(code), 'utf8')) as Stored
    } catch {
      return null
    }
  }
}

/** Limiteur de débit en mémoire : `limit` requêtes par fenêtre de `windowMs`, par clé (IP). */
export class RateLimiter {
  private hits = new Map<string, { n: number; reset: number }>()

  private readonly limit: number
  private readonly windowMs: number

  constructor(limit = 40, windowMs = 60_000) {
    this.limit = limit
    this.windowMs = windowMs
  }

  allow(key: string, now = Date.now()): boolean {
    const h = this.hits.get(key)
    if (!h || now >= h.reset) {
      this.hits.set(key, { n: 1, reset: now + this.windowMs })
      if (this.hits.size > 5000) this.gc(now)
      return true
    }
    h.n++
    return h.n <= this.limit
  }

  private gc(now: number): void {
    for (const [k, v] of this.hits) if (now >= v.reset) this.hits.delete(k)
  }
}
