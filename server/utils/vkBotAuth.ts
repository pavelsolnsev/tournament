import type { H3Event } from 'h3'

/**
 * Токен для интеграции бота:
 * 1) VK_BOT_TOKEN (предпочтительно, отдельный секрет интеграции),
 * 2) FOOTBALL_TOKEN (совместимость с vk-bot .env),
 * 3) VK_TOKEN (legacy).
 */
function resolveExpectedBotToken() {
  return (process.env.VK_BOT_TOKEN ?? process.env.FOOTBALL_TOKEN ?? process.env.VK_TOKEN ?? '').trim()
}

/** Проверка Bearer токена — общая для эндпоинтов, которые вызывает бот. */
export function requireVkBotToken(event: H3Event) {
  const authHeader = getHeader(event, 'authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  const expected = resolveExpectedBotToken()
  if (!expected || token !== expected) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: invalid token' })
  }
}
