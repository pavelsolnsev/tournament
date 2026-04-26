import { ensureTablesExist } from '../../utils/initDb'
import { requireVkBotToken } from '../../utils/vkBotAuth'
import { clearVkStartListRequest } from '../../utils/vkStartListRequest'

// Бот вызывает после обработки запроса на старт списка с сайта — снимаем флаг, чтобы не зациклиться.

export default defineEventHandler(async (event) => {
  await ensureTablesExist()
  requireVkBotToken(event)
  await clearVkStartListRequest()
  return { ok: true }
})
