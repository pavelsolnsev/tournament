import { ensureTablesExist } from '../../utils/initDb'
import { requireVkBotToken } from '../../utils/vkBotAuth'
import { clearVkListCloseRequest } from '../../utils/vkListCloseRequest'

// Бот вызывает после попытки закрыть список — убираем флаг, чтобы не крутить e! бесконечно.

export default defineEventHandler(async (event) => {
  await ensureTablesExist()
  requireVkBotToken(event)
  await clearVkListCloseRequest()
  return { ok: true }
})
