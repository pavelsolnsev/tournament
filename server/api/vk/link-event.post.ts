import { queryWithRetry } from '../../utils/db'
import { ensureTablesExist } from '../../utils/initDb'
import { requireVkBotToken } from '../../utils/vkBotAuth'

const LINK_KEY = 'tournament_vk_link'

// Бот вызывает после создания списка в чате — привязываем peer + id события к сайту (один глобальный турнир).

interface LinkBody {
  peer_id?: number
  game_event_id?: string
}

export default defineEventHandler(async (event) => {
  await ensureTablesExist()
  requireVkBotToken(event)

  const body = await readBody<LinkBody>(event)
  const peerId = Number(body?.peer_id)
  const gameEventId = typeof body?.game_event_id === 'string' ? body.game_event_id.trim() : ''

  if (!peerId || !Number.isFinite(peerId) || !gameEventId) {
    throw createError({ statusCode: 400, statusMessage: 'peer_id and game_event_id are required' })
  }

  const payload = JSON.stringify({ peerId, gameEventId })
  await queryWithRetry(
    `INSERT INTO app_state (key_name, value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    [LINK_KEY, payload],
  )

  return { ok: true }
})
