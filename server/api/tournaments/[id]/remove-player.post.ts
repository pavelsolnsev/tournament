import { queryWithRetry } from '../../../utils/db'
import { parseArchiveRoster, removePlayerFromArchiveRoster } from '../../../utils/removePlayerFromArchiveRoster'

// API: POST /api/tournaments/:id/remove-player — убирает игрока из состава архивного турнира.
// Турнир уже сыгран: матчи, таблица и рейтинг не пересчитываются — правка чисто для показа
// (например, в составе оказался игрок, который на самом деле не участвовал).
// Игрока убираем из players и teams записи архива; в таблице players (общая база) и в его
// личной статистике/рейтинге это никак не отражается — они не трогаются.
export default defineEventHandler(async (event) => {
  const session = getCookie(event, 'admin_session')
  // Simple10: правка состава архива — как удаление игрока в живом турнире, только полный админ.
  if (session !== 'full') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: full admin only' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Tournament id is required' })
  }

  const body = await readBody<{ playerId?: number }>(event)
  const playerId = Number(body?.playerId)
  if (!Number.isFinite(playerId) || playerId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'playerId is required' })
  }

  type ArchiveRosterRow = { players: string; teams: string }

  try {
    const rows = await queryWithRetry<ArchiveRosterRow[]>(
      'SELECT players, teams FROM tournament_archives WHERE id = ? LIMIT 1',
      [id],
    )
    const row = Array.isArray(rows) ? rows[0] : undefined
    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Tournament not found' })
    }

    const { players, assignmentByPlayerId } = parseArchiveRoster(row.players, row.teams)
    const next = removePlayerFromArchiveRoster(players, assignmentByPlayerId, playerId)

    await queryWithRetry(
      'UPDATE tournament_archives SET players = ?, teams = ? WHERE id = ?',
      [JSON.stringify(next.players), JSON.stringify(next.assignmentByPlayerId), id],
    )

    return { ok: true, ...next }
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    console.error('[tournaments/[id]/remove-player] error:', err)
    throw createError({ statusCode: 500, statusMessage: 'Failed to remove player from tournament' })
  }
})
