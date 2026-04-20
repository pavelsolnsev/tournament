import { ensureTablesExist } from '../../utils/initDb'
import { requireVkBotToken } from '../../utils/vkBotAuth'
import { clearVkStartRequest } from '../../utils/vkStartRequest'

// API: POST /api/vk/start-request-ack — бот подтверждает, что обработал запрос на создание списка.
export default defineEventHandler(async (event) => {
  await ensureTablesExist()
  requireVkBotToken(event)

  await clearVkStartRequest()

  return { ok: true }
})

