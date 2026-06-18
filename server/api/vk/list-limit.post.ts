import { queryWithRetry } from '../../utils/db'
import { ensureTablesExist } from '../../utils/initDb'
import { requireVkBotToken } from '../../utils/vkBotAuth'

// API: POST /api/vk/list-limit — бот шлёт при команде l<N> в чате.
// Пишет общий лимит списка в app_state.tournament.vkListLimit, чтобы поллинг не откатил его.

const TOURNAMENT_KEY = 'tournament'
const VK_LIST_LIMIT_MAX = 200

interface ListLimitBody {
  limit?: number
}

type AppStateRow = { value: string }
type DbWriteResult = { affectedRows?: number }

export default defineEventHandler(async (event) => {
  await ensureTablesExist()
  requireVkBotToken(event)

  const body = await readBody<ListLimitBody>(event)
  const limit = Math.floor(Number(body?.limit))
  if (!Number.isFinite(limit) || limit < 1) {
    throw createError({ statusCode: 400, statusMessage: 'limit must be an integer >= 1' })
  }
  const safeLimit = Math.min(limit, VK_LIST_LIMIT_MAX)

  // CAS-обновление состояния — чтобы не затереть параллельные изменения состава/слотов.
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const rows = await queryWithRetry<AppStateRow[]>(
      'SELECT value FROM app_state WHERE key_name = ?',
      [TOURNAMENT_KEY],
    )
    const prev = rows.length > 0 && rows[0]?.value ? rows[0].value : null

    let state: Record<string, unknown> = {}
    if (prev) {
      try {
        state = JSON.parse(prev) as Record<string, unknown>
      } catch {
        state = {}
      }
    }

    state.vkListLimit = safeLimit
    const next = JSON.stringify(state)

    if (prev != null) {
      const res = await queryWithRetry<DbWriteResult>(
        'UPDATE app_state SET value = ? WHERE key_name = ? AND value = ?',
        [next, TOURNAMENT_KEY, prev],
      )
      if (Number(res?.affectedRows ?? 0) === 1) {
        return { ok: true, limit: safeLimit }
      }
    } else {
      const res = await queryWithRetry<DbWriteResult>(
        'INSERT IGNORE INTO app_state (key_name, value) VALUES (?, ?)',
        [TOURNAMENT_KEY, next],
      )
      if (Number(res?.affectedRows ?? 0) === 1) {
        return { ok: true, limit: safeLimit }
      }
    }
  }

  throw createError({ statusCode: 409, statusMessage: 'Concurrent update conflict on tournament state' })
})
