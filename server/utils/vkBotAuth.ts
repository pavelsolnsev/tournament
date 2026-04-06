import type { H3Event } from 'h3'

/** Проверка Bearer VK_TOKEN — общая для эндпоинтов, которые вызывает бот. */
export function requireVkBotToken(event: H3Event) {
  const authHeader = getHeader(event, 'authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  const expected = process.env.VK_TOKEN ?? ''
  if (!expected || token !== expected) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: invalid token' })
  }
}
