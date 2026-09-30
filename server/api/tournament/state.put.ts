import { ensureTablesExist } from '../../utils/initDb'
import { persistTournamentStatePutBody } from '../../utils/persistTournamentStatePutBody'

// API: PUT /api/tournament/state — сохраняет состояние турнира в базу данных.
// Только администратор может сохранять состояние.

export default defineEventHandler(async (event) => {
  await ensureTablesExist()

  const session = getCookie(event, 'admin_session')
  // Simple10: Сохранять состояние может любой админ (full или limited).
  if (session !== 'full' && session !== 'limited') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin only' })
  }

  const body = await readBody(event)

  if (!body || typeof body.state === 'undefined') {
    throw createError({ statusCode: 400, statusMessage: 'State is required' })
  }

  const state = body.state as Record<string, unknown>
  await persistTournamentStatePutBody(state)

  return { ok: true }
})
