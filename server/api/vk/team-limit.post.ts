import { queryWithRetry } from '../../utils/db'
import { ensureTablesExist } from '../../utils/initDb'
import { requireVkBotToken } from '../../utils/vkBotAuth'

// API: POST /api/vk/team-limit — бот шлёт при команде tl<N> <лимит> в чате.
// Пишет лимит конкретной команды в app_state.tournament.vkTeamLimits, чтобы поллинг не откатил его.

const TOURNAMENT_KEY = 'tournament'
const VK_TEAM_LIMIT_MAX = 99

interface TeamLimitBody {
  team?: string
  limit?: number
}

type AppStateRow = { value: string }
type DbWriteResult = { affectedRows?: number }

/** Ключ команды как в боте/снимке: один пробел, без краёв, нижний регистр. */
function normTeamKey(raw: string): string {
  return String(raw ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
}

export default defineEventHandler(async (event) => {
  await ensureTablesExist()
  requireVkBotToken(event)

  const body = await readBody<TeamLimitBody>(event)
  const teamKey = normTeamKey(body?.team ?? '')
  const limit = Math.floor(Number(body?.limit))

  if (!teamKey) {
    throw createError({ statusCode: 400, statusMessage: 'team is required' })
  }
  if (!Number.isFinite(limit) || limit < 1) {
    throw createError({ statusCode: 400, statusMessage: 'limit must be an integer >= 1' })
  }
  const safeLimit = Math.min(limit, VK_TEAM_LIMIT_MAX)

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

    const prevLimits =
      state.vkTeamLimits && typeof state.vkTeamLimits === 'object' && !Array.isArray(state.vkTeamLimits)
        ? { ...(state.vkTeamLimits as Record<string, number>) }
        : {}
    prevLimits[teamKey] = safeLimit
    state.vkTeamLimits = prevLimits

    const next = JSON.stringify(state)

    if (prev != null) {
      const res = await queryWithRetry<DbWriteResult>(
        'UPDATE app_state SET value = ? WHERE key_name = ? AND value = ?',
        [next, TOURNAMENT_KEY, prev],
      )
      if (Number(res?.affectedRows ?? 0) === 1) {
        return { ok: true, team: teamKey, limit: safeLimit }
      }
    } else {
      const res = await queryWithRetry<DbWriteResult>(
        'INSERT IGNORE INTO app_state (key_name, value) VALUES (?, ?)',
        [TOURNAMENT_KEY, next],
      )
      if (Number(res?.affectedRows ?? 0) === 1) {
        return { ok: true, team: teamKey, limit: safeLimit }
      }
    }
  }

  throw createError({ statusCode: 409, statusMessage: 'Concurrent update conflict on tournament state' })
})
