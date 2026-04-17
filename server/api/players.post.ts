import { ensureTablesExist } from '../utils/initDb'
import { normalizePlayerUsername } from '../utils/normalizePlayerUsername'
import { removeEmoji } from '../utils/emojiStrip'
import { createPlayerInDb } from '../utils/createPlayerInDb'

// Только администратор может добавлять игроков в систему.
export default defineEventHandler(async (event) => {
  await ensureTablesExist()

  const session = getCookie(event, 'admin_session')
  // Simple10: Создавать игроков может только полный админ (full).
  if (session !== 'full') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: full admin only' })
  }

  const body = await readBody<{ name?: string; username?: string }>(event)
  const rawName = body?.name
  const rawUsername = body?.username

  const name = removeEmoji(rawName) || removeEmoji(rawUsername)
  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name is required',
    })
  }

  const username = normalizePlayerUsername(removeEmoji(rawUsername))

  try {
    const row = await createPlayerInDb({ name, username: username ?? null })
    return { id: row.id, name: row.name, username: row.username, vk_user_id: row.vk_user_id }
  } catch (err) {
    console.error('players.post error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create player',
    })
  }
})
