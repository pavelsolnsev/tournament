import type { RowDataPacket } from 'mysql2'
import type { TournamentArchiveSnapshot } from '../../../../app/types/tournamentArchive'
import { getPool } from '../../../utils/db'
import { parseArchiveRoster } from '../../../utils/removePlayerFromArchiveRoster'
import { updateArchivedMatchStats } from '../../../utils/updateArchivedMatchStats'

export default defineEventHandler(async event => {
  if (getCookie(event, 'admin_session') !== 'full') throw createError({ statusCode: 403 })
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400 })
  const body = await readBody(event)
  if (!body || typeof body !== 'object') throw createError({ statusCode: 400 })
  const conn = await getPool().getConnection()
  try {
    await conn.beginTransaction()
    const [rows] = await conn.execute<RowDataPacket[]>('SELECT snapshot, players, teams FROM tournament_archives WHERE id = ? FOR UPDATE', [id])
    const row = rows[0]
    if (!row) throw createError({ statusCode: 404 })
    const raw = row.snapshot
    const snapshot = (typeof raw === 'string' || Buffer.isBuffer(raw) ? JSON.parse(String(raw)) : raw) as TournamentArchiveSnapshot
    if (!Array.isArray(snapshot?.playedMatchesList) || !Array.isArray(snapshot.standingsRows)) throw createError({ statusCode: 400 })
    const { players, assignmentByPlayerId } = parseArchiveRoster(row.players, row.teams)
    const next = updateArchivedMatchStats(snapshot, players, assignmentByPlayerId, body)
    await conn.execute('UPDATE tournament_archives SET snapshot = ? WHERE id = ?', [JSON.stringify(next), id])
    await conn.commit()
    return { snapshot: next }
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
})
