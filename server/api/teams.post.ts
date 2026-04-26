import { ensureTablesExist } from '../utils/initDb'
import { getPool, queryWithRetry } from '../utils/db'
import type { ResultSetHeader } from 'mysql2'

function normalizeTeamName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

// POST /api/teams — создать команду в справочнике (если ещё нет). Только полный админ.
export default defineEventHandler(async (event) => {
  await ensureTablesExist()

  const session = getCookie(event, 'admin_session')
  if (session !== 'full') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: full admin only' })
  }

  const body = await readBody<{ name?: string }>(event)
  const name = normalizeTeamName(typeof body?.name === 'string' ? body.name : '')
  if (name.length < 2) {
    throw createError({ statusCode: 400, statusMessage: 'Team name is required' })
  }

  if (/^Команда \d+$/i.test(name)) {
    return { ok: true as const, skipped: true as const, reason: 'default_auto_name' as const }
  }

  const existing = await queryWithRetry<Array<{ id: number }>>(
    'SELECT id FROM teams WHERE name = ? LIMIT 1',
    [name],
  )
  if (existing.length > 0 && existing[0]) {
    return { ok: true as const, id: existing[0].id, created: false as const }
  }

  try {
    const [res] = await getPool().query(
      `INSERT INTO teams (name, tournament_count, points, wins, draws, losses, goals_scored, goals_conceded, trophies)
       VALUES (?, 0, 0, 0, 0, 0, 0, 0, 0)`,
      [name],
    )
    const header = res as ResultSetHeader
    return { ok: true as const, id: header.insertId, created: true as const }
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code
    if (code === 'ER_DUP_ENTRY') {
      const again = await queryWithRetry<Array<{ id: number }>>(
        'SELECT id FROM teams WHERE name = ? LIMIT 1',
        [name],
      )
      const id = again[0]?.id
      if (id != null) {
        return { ok: true as const, id, created: false as const }
      }
    }
    console.error('teams.post error:', err)
    throw createError({ statusCode: 500, statusMessage: 'Failed to create team' })
  }
})
