import { queryWithRetry } from '../../utils/db'
import { ensureTablesExist } from '../../utils/initDb'
import { requireVkBotToken } from '../../utils/vkBotAuth'
import { getRequestIdempotencyKey, runIdempotent } from '../../utils/idempotency'

// API: POST /api/vk/leave — вызывается VK-ботом при «Выйти», «-», команде rN и т.п.
// Только убирает из selectedIds (состояние турнира). Таблицу players не трогает.

// Тип тела запроса от бота.
interface VkLeaveBody {
  vk_user_id: number
}

// Тип строки состояния турнира из базы.
interface TournamentState {
  selectedIds?: number[]
  vkTeamLabelByPlayerId?: Record<string, string>
  /** При live выход через бота из списка турнира запрещён (состав на сайте заморожен). */
  matchStatus?: string
  [key: string]: unknown
}

const TOURNAMENT_KEY = 'tournament'
type AppStateRow = { value: string }
type DbWriteResult = { affectedRows?: number }

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
    // Читаем тело запроса от бота.
    const body = await readBody<VkLeaveBody>(event)

    // vk_user_id обязателен — по нему ищем игрока в базе.
    const vkUserId = Number(body?.vk_user_id)
    if (!vkUserId || !Number.isFinite(vkUserId)) {
      throw createError({ statusCode: 400, statusMessage: 'vk_user_id is required' })
    }

    // Во время live не снимаем с турнира на сайте — иначе расходится с замороженным составом.
    const stateRowsEarly = await queryWithRetry<AppStateRow[]>(
      'SELECT value FROM app_state WHERE key_name = ?',
      [TOURNAMENT_KEY],
    )
    if (stateRowsEarly.length > 0 && stateRowsEarly[0]?.value) {
      try {
        const early = JSON.parse(stateRowsEarly[0].value) as TournamentState
        if (early.matchStatus === 'live') {
          throw createError({
            statusCode: 409,
            statusMessage: 'Tournament live: leave closed',
            data: { code: 'TOURNAMENT_LIVE' },
          })
        }
      } catch (err) {
        if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 409) {
          throw err
        }
      }
    }

    // Ищем игрока по vk_user_id — нужен его внутренний id для удаления из selectedIds.
    const rows = await queryWithRetry<Array<{ id: number }>>(
      'SELECT id FROM players WHERE vk_user_id = ?',
      [vkUserId],
    )

    if (rows.length === 0 || !rows[0]) {
      // Игрок не найден — ничего не делаем, возвращаем ok.
      return { ok: true, removed: false }
    }

    const playerId = rows[0].id

    // CAS-обновление состояния, чтобы параллельные leave/join не теряли изменения.
    for (let attempt = 0; attempt < 8; attempt++) {
      const rows = await queryWithRetry<AppStateRow[]>(
        'SELECT value FROM app_state WHERE key_name = ?',
        [TOURNAMENT_KEY],
      )
      const prev = rows.length > 0 && rows[0]?.value ? rows[0].value : null
      if (!prev) return { ok: true, removed: false }

      let state: TournamentState
      try {
        state = JSON.parse(prev) as TournamentState
      } catch {
        return { ok: true, removed: false }
      }

      const existingIds: number[] = Array.isArray(state.selectedIds) ? state.selectedIds : []
      const newIds = existingIds.filter((id) => id !== playerId)
      if (newIds.length === existingIds.length) {
        return { ok: true, removed: false }
      }

      state.selectedIds = newIds
      if (state.vkTeamLabelByPlayerId && typeof state.vkTeamLabelByPlayerId === 'object') {
        const k = String(playerId)
        // Убираем подпись команды без delete[key] — так проходит ESLint no-dynamic-delete.
        const vk = Object.fromEntries(
          Object.entries(state.vkTeamLabelByPlayerId).filter(([key]) => key !== k),
        )
        if (Object.keys(vk).length === 0) {
          state.vkTeamLabelByPlayerId = undefined
        } else {
          state.vkTeamLabelByPlayerId = vk
        }
      }
      const next = JSON.stringify(state)
      const ok = await persistTournamentStateCas(prev, next)
      if (ok) return { ok: true, removed: true, playerId }
    }

    throw createError({ statusCode: 409, statusMessage: 'Concurrent update conflict on tournament state' })
  })
})
