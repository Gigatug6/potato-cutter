import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { MAX_BYTES, RateLimiter, SaveStore, validCode, validSavePayload } from './store.ts'

/** API minimale de sauvegarde en ligne : GET/PUT /api/save/:code (sans dépendance). */

function send(res: ServerResponse, status: number, body: unknown): void {
  const data = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  })
  res.end(data)
}

async function readBody(req: IncomingMessage): Promise<string | null> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const c of req) {
    size += (c as Buffer).length
    if (size > MAX_BYTES) return null
    chunks.push(c as Buffer)
  }
  return Buffer.concat(chunks).toString('utf8')
}

export function createApi(dataDir: string, limiter = new RateLimiter()): Server {
  const store = new SaveStore(dataDir)
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://x')
      const ip = String(req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? '?').split(',')[0].trim()
      if (url.pathname === '/api/health') return send(res, 200, { ok: true })
      const m = url.pathname.match(/^\/api\/save\/([^/]+)$/)
      if (!m) return send(res, 404, { error: 'not_found' })
      if (!limiter.allow(ip)) return send(res, 429, { error: 'rate_limited' })
      const code = m[1]
      if (!validCode(code)) return send(res, 400, { error: 'invalid_code' })

      if (req.method === 'GET') {
        const stored = await store.read(code)
        return stored ? send(res, 200, stored) : send(res, 404, { error: 'unknown_code' })
      }
      if (req.method === 'PUT') {
        const raw = await readBody(req)
        if (raw === null) return send(res, 413, { error: 'too_large' })
        let body: unknown
        try { body = JSON.parse(raw) } catch { return send(res, 400, { error: 'invalid_json' }) }
        if (!validSavePayload(body)) return send(res, 400, { error: 'invalid_save' })
        const stored = await store.write(code, body)
        return send(res, 200, { ok: true, updatedAt: stored.updatedAt })
      }
      res.setHeader('Allow', 'GET, PUT')
      return send(res, 405, { error: 'method_not_allowed' })
    } catch {
      return send(res, 500, { error: 'server_error' })
    }
  })
}

// démarrage direct : `node server/index.ts`
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop()!)) {
  const port = Number(process.env.PORT ?? 3000)
  createApi(process.env.DATA_DIR ?? '/data').listen(port, () => console.log(`API de sauvegarde sur :${port}`))
}
