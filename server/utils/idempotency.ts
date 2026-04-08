import type { H3Event } from 'h3'

type DoneEntry<T> = {
  expiresAt: number
  result: T
}

const done = new Map<string, DoneEntry<unknown>>()
const inFlight = new Map<string, Promise<unknown>>()

function getIdempotencyTtlMs() {
  const ttl = Number(process.env.VK_IDEMPOTENCY_TTL_MS || 5000)
  return Number.isFinite(ttl) && ttl > 0 ? ttl : 5000
}

function cleanupIdempotencyCache(now = Date.now()) {
  for (const [key, entry] of done) {
    if (entry.expiresAt <= now) done.delete(key)
  }
}

function normalizeIdempotencyKey(raw: string) {
  const key = String(raw ?? '').trim()
  if (!key) return ''
  if (key.length > 160) return ''
  return key
}

/** Ключ привязан к маршруту, чтобы join/leave не конфликтовали между собой. */
function buildScopedKey(event: H3Event, key: string) {
  const path = event.path || event.node.req.url || '/unknown'
  return `${path}::${key}`
}

export function getRequestIdempotencyKey(event: H3Event) {
  const raw = getHeader(event, 'x-idempotency-key') ?? ''
  const normalized = normalizeIdempotencyKey(raw)
  if (!normalized) return null
  return buildScopedKey(event, normalized)
}

/**
 * Выполняет handler идемпотентно по ключу:
 * - повтор во время in-flight ждёт тот же Promise;
 * - повтор в TTL получает тот же результат без повторной записи в БД.
 */
export async function runIdempotent<T>(key: string | null, handler: () => Promise<T>): Promise<T> {
  if (!key) return await handler()

  const now = Date.now()
  cleanupIdempotencyCache(now)

  const cached = done.get(key)
  if (cached && cached.expiresAt > now) {
    return cached.result as T
  }

  const existingInFlight = inFlight.get(key)
  if (existingInFlight) {
    return (await existingInFlight) as T
  }

  const p = (async () => {
    const result = await handler()
    done.set(key, { expiresAt: Date.now() + getIdempotencyTtlMs(), result })
    return result
  })()
    .finally(() => {
      inFlight.delete(key)
    })

  inFlight.set(key, p)
  return (await p) as T
}

