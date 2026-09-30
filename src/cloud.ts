import { parseSave, type SaveV1 } from './game/save/saveSchema'

/** Sauvegarde en ligne : code de synchronisation aléatoire (80 bits), pas de compte. Voir server/index.ts. */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const CODE_KEY = 'potato-cutter:sync-code'

/** Faux sur un hébergement statique (GitHub Pages) : pas d'API, la section « sauvegarde en ligne » est masquée. */
export const CLOUD_ENABLED = import.meta.env.VITE_CLOUD !== 'off'
/** Adresse de l'API (par défaut : même origine, /api). */
const API = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api'

export const CODE_RE = /^[A-Z2-7]{16}$/

export function generateCode(rand: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string {
  return Array.from(rand(16), (b) => ALPHABET[b % 32]).join('')
}

/** « abcd-efgh ijkl mnop » → « ABCDEFGHIJKLMNOP » ; renvoie '' si invalide. */
export function normalizeCode(input: string): string {
  const c = input.toUpperCase().replace(/[\s-]/g, '')
  return CODE_RE.test(c) ? c : ''
}

export const formatCode = (c: string): string => c.match(/.{1,4}/g)?.join('-') ?? c

export function storedCode(): string {
  try { return localStorage.getItem(CODE_KEY) ?? '' } catch { return '' }
}

export function storeCode(code: string): void {
  try { localStorage.setItem(CODE_KEY, code) } catch { /* mode privé */ }
}

export type CloudError = 'network' | 'unknown_code' | 'rate_limited' | 'too_large' | 'server'

export class CloudFailure extends Error {
  constructor(readonly kind: CloudError) { super(kind) }
}

async function call(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${API}/save/${path}`, init)
  } catch {
    throw new CloudFailure('network')
  }
}

function fail(res: Response): never {
  throw new CloudFailure(res.status === 404 ? 'unknown_code' : res.status === 429 ? 'rate_limited' : res.status === 413 ? 'too_large' : 'server')
}

export async function pushSave(code: string, save: SaveV1): Promise<string> {
  const res = await call(code, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(save) })
  if (!res.ok) fail(res)
  return (await res.json()).updatedAt as string
}

/** Récupère et répare (parseSave) la sauvegarde distante. */
export async function pullSave(code: string): Promise<{ save: SaveV1; updatedAt: string }> {
  const res = await call(code)
  if (!res.ok) fail(res)
  const j = await res.json()
  return { save: parseSave(j.save), updatedAt: j.updatedAt }
}

export function downloadSave(save: SaveV1): void {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' }))
  a.download = `potato-cutter-save-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
}

/** Lit un fichier de sauvegarde ; parseSave répare/filtre tout contenu invalide. Renvoie null si ce n'est pas du JSON. */
export async function readSaveFile(file: File): Promise<SaveV1 | null> {
  try {
    const raw = JSON.parse(await file.text()) as unknown
    if (typeof raw !== 'object' || raw === null || (raw as { version?: unknown }).version !== 1) return null
    return parseSave(raw)
  } catch {
    return null
  }
}
