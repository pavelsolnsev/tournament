import { queryWithRetry } from '../../utils/db'
import { ensureTablesExist } from '../../utils/initDb'

// API: DELETE /api/feedback — очищает всю историю пожеланий. Только для администратора.
export default defineEventHandler(async (event) => {
  await ensureTablesExist()

  // Проверяем, что запрос делает администратор.
  const session = getCookie(event, 'admin_session')
  // Simple10: Очистка пожеланий — админская операция, но не влияет на игроков/турнир, разрешаем full и limited.
  if (session !== 'full' && session !== 'limited') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin only' })
  }

  // Удаляем все пожелания из таблицы.
  await queryWithRetry('DELETE FROM feedback')

  return { ok: true }
})
