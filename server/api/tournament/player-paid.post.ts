import { ensureTablesExist } from '../../utils/initDb'
import { setPlayerPaidFlag } from '../../utils/tournamentPaidPlayers'

// POST /api/tournament/player-paid — отметка оплаты игрока в текущем списке турнира (как «p» в боте).
export default defineEventHandler(async (event) => {
  await ensureTablesExist()

  const session = getCookie(event, 'admin_session')
  if (session !== 'full' && session !== 'limited') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin only' })
  }

  const body = await readBody(event)
  const playerId = Number(body?.playerId)
  const paid = body?.paid === true
  if (!Number.isFinite(playerId) || playerId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'playerId is required' })
  }

  const result = await setPlayerPaidFlag({ playerId, paid })
  if (!result.ok) {
    throw createError({ statusCode: 400, statusMessage: result.statusMessage })
  }

  return { ok: true, paidPlayerIds: result.paidPlayerIds }
})
