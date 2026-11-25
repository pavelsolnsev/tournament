import { randomUUID } from 'node:crypto'
import { queryWithRetry } from '../../utils/db'
import { ensureTablesExist } from '../../utils/initDb'
import { changeTournamentReserve } from '../../utils/changeTournamentReserve'
import { readTournamentStateRow } from '../../utils/tournamentPaidPlayers'
import { writeTournamentStateCas } from '../../utils/tournamentStateCas'

export default defineEventHandler(async event => {
  if (getCookie(event, 'admin_session') !== 'full') throw createError({ statusCode: 403 })
  const body = await readBody<Record<string, unknown>>(event)
  if (!body || typeof body !== 'object') throw createError({ statusCode: 400 })
  await ensureTablesExist()
  if (body.action === 'claim') {
    const playerId = Number(body.playerId)
    if (!Number.isSafeInteger(playerId) || playerId <= 0) throw createError({ statusCode: 400 })
    const rows = await queryWithRetry<{ id: number }[]>('SELECT id FROM players WHERE id = ?', [playerId])
    if (!rows.length) throw createError({ statusCode: 404, data: { message: 'Игрок не найден в базе.' } })
  }
  const id = randomUUID()
  for (let attempt = 0; attempt < 8; attempt++) {
    const previous = await readTournamentStateRow()
    const state = changeTournamentReserve(previous?.json ?? { step: 0, matchStatus: 'upcoming' }, body, id)
    if (await writeTournamentStateCas(previous?.raw ?? null, state)) return { state }
  }
  throw createError({ statusCode: 409, data: { message: 'Список обновился одновременно. Повторите действие.' } })
})
