import { getPool } from '../../utils/db'

// Ожидаем массив { id, delta } — обновляем рейтинг каждого игрока в БД.
type RatingUpdate = {
  id: number
  delta: number
}

// Округляем до 1 знака после запятой — так же как в боте.
function round1(n: number): number {
  return Math.round(n * 10) / 10
}

// Только администратор может обновлять рейтинги игроков.
export default defineEventHandler(async (event) => {
  const session = getCookie(event, 'admin_session')
  // Simple10: Обновление рейтингов — это изменение данных игроков, доступно только полному админу (full).
  if (session !== 'full') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: full admin only' })
  }

  const body = await readBody<{ updates?: RatingUpdate[] }>(event)

  if (!Array.isArray(body?.updates) || body.updates.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'updates array is required' })
  }

  try {
    const pool = getPool()

    // Обновляем каждого игрока отдельно — rating не может превышать 200.
    await Promise.all(
      body.updates.map(({ id, delta }) =>
        pool.query(
          `UPDATE players SET rating = LEAST(ROUND(rating + ?, 1), 200) WHERE id = ?`,
          [round1(delta), id],
        ),
      ),
    )

    return { ok: true, updated: body.updates.length }
  } catch (err) {
    console.error('players/rating.patch error:', err)
    throw createError({ statusCode: 500, statusMessage: 'Failed to update ratings' })
  }
})
