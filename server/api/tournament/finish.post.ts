import { getPool } from '../../utils/db'
import { setVkListCloseRequested } from '../../utils/vkListCloseRequest'
import { savePlayersToDb } from './save-players'
import { saveTeamsToDb } from './save-teams'
import { saveTournamentArchive } from '../../utils/saveTournamentArchive'
import type { PlayerTournamentData } from './save-players'
import type { TeamTournamentData } from './save-teams'
import type { SavedStandingsSnapshot } from '../../../app/composables/useTournamentWizard'
import type { Player } from '../../../app/types/tournament'

type FinishTournamentBody = {
  players: PlayerTournamentData[]
  teams: TeamTournamentData[]
  // Данные для архива — название, дата, место, формат и снапшот турнира.
  tournamentName: string
  tournamentDate: string
  venueLabel: string
  formatLabel: string
  snapshot: SavedStandingsSnapshot
  allPlayers: Player[]
  assignmentByPlayerId: Record<number, string>
  teamColors: Record<string, number>
}

// Завершение турнира: сохраняем игроков и команды в одной транзакции.
// Если что-то упадёт — откатываем всё целиком (данные не запишутся частично).
// Только администратор может завершить турнир.
export default defineEventHandler(async (event) => {
  const session = getCookie(event, 'admin_session')
  // Simple10: Завершить турнир может только полный админ (full).
  if (session !== 'full') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: full admin only' })
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

    // 3) Сохраняем архивную запись турнира — она нужна для страницы /tournaments/[id].
    const archiveId = await saveTournamentArchive(
      {
        tournamentName: body.tournamentName,
        tournamentDate: body.tournamentDate,
        venueLabel: body.venueLabel ?? '',
        formatLabel: body.formatLabel ?? '',
        snapshot: body.snapshot,
        players: body.allPlayers,
        assignmentByPlayerId: body.assignmentByPlayerId,
        teamColors: body.teamColors,
      },
      conn,
    )

    // Всё прошло — фиксируем.
    await conn.commit()

    // Просим бота закрыть список в ВК (как e!), если был открыт.
    await setVkListCloseRequested().catch((e) => console.error('[tournament/finish] vk list close flag:', e))

    return { ok: true, savedPlayers: body.players.length, savedTeams: body.teams.length, archiveId }
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
