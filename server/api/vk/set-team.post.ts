import { queryWithRetry } from '../../utils/db'
import { ensureTablesExist } from '../../utils/initDb'
import { requireVkBotToken } from '../../utils/vkBotAuth'
import { getRequestIdempotencyKey, runIdempotent } from '../../utils/idempotency'

// POST /api/vk/set-team — бот: смена команды (mvteam / аналог), синхронизирует vkTeamLabelByPlayerId на сайте.

interface VkSetTeamBody {
  vk_user_id?: number
  /** Пусто / null — снять метку. */
  team?: string | null
}

interface TournamentState {
  selectedIds?: number[]
  vkTeamLabelByPlayerId?: Record<string, string>
  matchStatus?: string
  [key: string]: unknown
}

const TOURNAMENT_KEY = 'tournament'
const VK_TEAM_MAX = 64

type AppStateRow = { value: string }
type DbWriteResult = { affectedRows?: number }

function normalizeOrNull(raw: string | null | undefined): string | null {
  if (raw == null) return null
  const t = String(raw).trim()
  if (!t) return null
  return t.slice(0, VK_TEAM_MAX)
}

function setVkLabelOnState(state: TournamentState, playerId: number, team: string | null) {
  const k = String(playerId)
  const base = (state.vkTeamLabelByPlayerId && typeof state.vkTeamLabelByPlayerId === 'object'
    ? state.vkTeamLabelByPlayerId
    : {}) as Record<string, string>
  const entries = Object.entries(base).filter(([key]) => key !== k)
  if (team) {
    entries.push([k, team])
  }
  if (entries.length === 0) {
    delete state.vkTeamLabelByPlayerId
  } else {
    state.vkTeamLabelByPlayerId = Object.fromEntries(entries) as Record<string, string>
  }
}

async function persistTournamentStateCas(prevValue: string | null, nextValue: string): Promise<boolean> {
  if (prevValue != null) {
    const res = await queryWithRetry<DbWriteResult>(
      'UPDATE app_state SET value = ? WHERE key_name = ? AND value = ?',
      [nextValue, TOURNAMENT_KEY, prevValue],
    )
    return Number(res?.affectedRows ?? 0) === 1
  }

  const res = await queryWithRetry<DbWriteResult>(
    'INSERT IGNORE INTO app_state (key_name, value) VALUES (?, ?)',
    [TOURNAMENT_KEY, nextValue],
  )
  return Number(res?.affectedRows ?? 0) === 1
}

export default defineEventHandler(async (event) => {
  await ensureTablesExist()
  requireVkBotToken(event)
  const idemKey = getRequestIdempotencyKey(event)

  return await runIdempotent(idemKey, async () => {
    const body = await readBody<VkSetTeamBody>(event)
    const vkUserId = Number(body?.vk_user_id)
    if (vkUserId == null || !Number.isFinite(vkUserId) || vkUserId === 0) {
      throw createError({ statusCode: 400, statusMessage: 'vk_user_id is required' })
    }
    const teamToSet = normalizeOrNull(body?.team as string | undefined)

    // matchStatus=live не блокируем: mvteam — только подпись «команда в чате», не состав live-матча.

    const rows = await queryWithRetry<Array<{ id: number }>>(
      'SELECT id FROM players WHERE vk_user_id = ?',
      [vkUserId],
    )
    if (rows.length === 0 || !rows[0]) {
      throw createError({ statusCode: 404, statusMessage: 'Player not found' })
    }
    const playerId = rows[0].id

    let persisted = false
    for (let attempt = 0; attempt < 8; attempt++) {
      const appRows = await queryWithRetry<AppStateRow[]>(
        'SELECT value FROM app_state WHERE key_name = ?',
        [TOURNAMENT_KEY],
      )
      const prev = appRows.length > 0 && appRows[0]?.value ? appRows[0].value : null
      let state: TournamentState = { selectedIds: [] }
      if (prev) {
        try {
          state = JSON.parse(prev) as TournamentState
        } catch {
          state = { selectedIds: [] }
        }
      }
      const selected = Array.isArray(state.selectedIds) ? state.selectedIds : []
      if (!selected.includes(playerId)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Player is not in the tournament list on the site',
          data: { code: 'NOT_IN_TOURNAMENT' },
        })
      }

      setVkLabelOnState(state, playerId, teamToSet)
      const next = JSON.stringify(state)
      const ok = await persistTournamentStateCas(prev, next)
      if (ok) {
        persisted = true
        break
      }
    }

    if (!persisted) {
      throw createError({ statusCode: 409, statusMessage: 'Concurrent update conflict on tournament state' })
    }

    return { ok: true, playerId, team: teamToSet }
  })
})
