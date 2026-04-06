import { queryWithRetry } from '../../utils/db'
import { ensureTablesExist } from '../../utils/initDb'
import { requireVkBotToken } from '../../utils/vkBotAuth'

const LINK_KEY = 'tournament_vk_link'

// Бот вызывает при закрытии события — без связи сайт не толкает состав в ВК.

export default defineEventHandler(async (event) => {
  await ensureTablesExist()
  requireVkBotToken(event)

  await queryWithRetry('DELETE FROM app_state WHERE key_name = ?', [LINK_KEY])

  return { ok: true }
})
