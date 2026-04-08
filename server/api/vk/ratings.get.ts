import { queryWithRetry } from '../../utils/db'
import { ensureTablesExist } from '../../utils/initDb'
import { requireVkBotToken } from '../../utils/vkBotAuth'

// GET /api/vk/ratings?vk_user_ids=1,2,-3
// Возвращает рейтинг и подписи из БД (username, name) по vk_user_id (включая synthetic).

type RatingRow = {
  vk_user_id: number
  rating: number
  name: string | null
  username: string | null
}

export default defineEventHandler(async (event) => {
  await ensureTablesExist()
  requireVkBotToken(event)

  const q = getQuery(event)
  const raw = typeof q.vk_user_ids === 'string' ? q.vk_user_ids : Array.isArray(q.vk_user_ids) ? q.vk_user_ids.join(',') : ''
  const ids = raw
    .split(',')
    .map((s) => Number(String(s).trim()))
    .filter((n) => Number.isFinite(n) && n !== 0)

  if (ids.length === 0) {
    return { ok: true, ratings: [] as RatingRow[] }
  }

  // Защита от слишком длинных запросов
  const unique = Array.from(new Set(ids)).slice(0, 200)

  const placeholders = unique.map(() => '?').join(',')
  const rows = await queryWithRetry<RatingRow[]>(
    `SELECT vk_user_id, rating, name, username FROM players WHERE vk_user_id IN (${placeholders})`,
    unique,
  )

  return {
    ok: true,
    ratings: (Array.isArray(rows) ? rows : []).map((r) => ({
      vk_user_id: Number(r.vk_user_id),
      rating: Number(r.rating) || 0,
      name: r.name != null ? String(r.name) : null,
      username: r.username != null ? String(r.username) : null,
    })),
  }
})

