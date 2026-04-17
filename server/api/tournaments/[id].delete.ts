import { queryWithRetry } from '../../utils/db'

// Удаляет запись турнира из архива по его UUID.
// Доступно только администратору — проверяем cookie admin_session.
export default defineEventHandler(async (event) => {
  const session = getCookie(event, 'admin_session')
  // Simple10: Удаление архива турнира — опасная операция, доступна только полному админу (full).
  if (session !== 'full') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: full admin only' })
  }

  const id = getRouterParam(event, 'id')

  // Защита от пустого id.
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Tournament id is required' })
  }

  try {
    const result = await queryWithRetry<unknown>(
      'DELETE FROM tournament_archives WHERE id = ?',
      [id],
    )

    // Если строка не найдена — возвращаем 404.
    const affected = (result as { affectedRows?: number })?.affectedRows ?? 0
    if (affected === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Tournament not found' })
    }

    return { ok: true }
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    console.error('[tournaments/[id].delete] error:', err)
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete tournament' })
  }
})
