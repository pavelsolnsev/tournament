import { ensureTablesExist } from '../../utils/initDb'
import { requireVkBotToken } from '../../utils/vkBotAuth'
import { normalizePlayerUsername } from '../../utils/normalizePlayerUsername'
import { removeEmoji } from '../../utils/emojiStrip'
import { createPlayerInDb } from '../../utils/createPlayerInDb'

// Бот: +add имя — создаём игрока в БД с отрицательным vk_user_id (как при создании с сайта).

interface Body {
  name?: string
}

export default defineEventHandler(async (event) => {
  await ensureTablesExist()
  requireVkBotToken(event)

  const body = await readBody<Body>(event)
  const name = removeEmoji(typeof body?.name === 'string' ? body.name : '').trim()
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'name is required' })
  }

  const username = normalizePlayerUsername('unknown')

  try {
    const row = await createPlayerInDb({ name, username })
    return { ok: true, id: row.id, name: row.name, username: row.username, vk_user_id: row.vk_user_id }
  } catch (err) {
    console.error('[vk/create-synthetic-player]', err)
    throw createError({ statusCode: 500, statusMessage: 'Failed to create player' })
  }
})
