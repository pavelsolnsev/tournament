import { getPool } from '../../utils/db'
import { savePlayersToDb } from './save-players'
import { saveTeamsToDb } from './save-teams'
import type { PlayerTournamentData } from './save-players'
import type { TeamTournamentData } from './save-teams'

type FinishTournamentBody = {
  players: PlayerTournamentData[]
  teams: TeamTournamentData[]
}

// Завершение турнира: сохраняем игроков и команды в одной транзакции.
// Если что-то упадёт — откатываем всё целиком (данные не запишутся частично).
// Только администратор может завершить турнир.
export default defineEventHandler(async (event) => {
  const session = getCookie(event, 'admin_session')
  if (session !== 'true') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin only' })
  }

  const body = await readBody<FinishTournamentBody>(event)

  // Проверяем входные данные перед тем как открывать транзакцию.
  if (!Array.isArray(body?.players) || !Array.isArray(body?.teams)) {
    throw createError({ statusCode: 400, statusMessage: 'players and teams arrays are required' })
  }

  if (body.players.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No players to save — tournament has no participants' })
  }

  const pool = getPool()
  const conn = await pool.getConnection()

  try {
    // Открываем транзакцию — все изменения атомарны.
    await conn.beginTransaction()

    // 1) Сохраняем статистику игроков.
    await savePlayersToDb(body.players, conn)

    // 2) Сохраняем команды и составы.
    await saveTeamsToDb(body.teams, conn)

    // Всё прошло — фиксируем.
    await conn.commit()

    return { ok: true, savedPlayers: body.players.length, savedTeams: body.teams.length }
  } catch (err) {
    // Что-то пошло не так — откатываем всё.
    await conn.rollback()
    console.error('tournament/finish error:', err)
    throw createError({ statusCode: 500, statusMessage: 'Failed to save tournament data' })
  } finally {
    // Всегда возвращаем соединение в пул.
    conn.release()
  }
})
