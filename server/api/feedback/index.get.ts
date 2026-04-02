import { queryWithRetry } from '../../utils/db'
import { ensureTablesExist } from '../../utils/initDb'

// API: GET /api/feedback — возвращает список пожеланий. Только для администратора.
export default defineEventHandler(async (event) => {
  await ensureTablesExist()

  // Проверяем, что запрос делает администратор.
  const session = getCookie(event, 'admin_session')
  if (session !== 'true') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin only' })
  }

  // Получаем все пожелания, сначала последние.
  const rows = await queryWithRetry<Array<{ id: number; text: string; created_at: string }>>(
    'SELECT id, text, created_at FROM feedback ORDER BY created_at DESC',
  )

  return Array.isArray(rows) ? rows : []
})
