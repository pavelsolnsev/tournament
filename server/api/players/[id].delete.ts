import { queryWithRetry } from '../../utils/db'

// API: DELETE /api/players/:id — единственный HTTP-способ удалить строку из players (кроме прямого SQL).
// Вызывается только из админки (кнопка корзины). Бот и /api/vk/* строки из players не удаляют.
// Только администратор (cookie admin_session).
export default defineEventHandler(async (event) => {
  // Проверяем сессию администратора.
  const session = getCookie(event, 'admin_session')
  if (session !== 'true') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin only' })
  }

  // Читаем id из URL-параметра.
  const id = Number(getRouterParam(event, 'id'))
  if (!id || !Number.isFinite(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid player id' })
  }

  try {
    // Удаляем игрока из таблицы players по id.
    await queryWithRetry('DELETE FROM players WHERE id = ?', [id])
    return { ok: true }
  } catch (err) {
    const mysqlErr = err as { sqlMessage?: string; message?: string }
    console.error('[players.delete] error:', mysqlErr?.sqlMessage ?? mysqlErr?.message)
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete player' })
  }
})
