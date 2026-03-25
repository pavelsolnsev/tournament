import { getPool } from '../../utils/db'

function normalizeUsername(text: string | null | undefined): string | null {
  const cleaned = (text ?? '').replace(/^@+/, '').trim()
  return cleaned ? cleaned : null
}
// Это убирает ведущую "@" и превращает пустое значение в null.

// Тип одной команды для сохранения.
export type TeamTournamentData = {
  name: string
  wins: number
  draws: number
  losses: number
  goalsScored: number
  goalsConceded: number
  place: number // 1-е, 2-е, 3-е место и т.д.
  tournamentPoints: number // реальные очки за матчи (3 за победу, 1 за ничью)
  players: Array<{
    id: number
    name: string
    username: string | null
  }>
}

// Сохраняет команды и составы (team_players) после завершения турнира.
// Логика точно совпадает с saveTeams.js бота.
export async function saveTeamsToDb(
  teams: TeamTournamentData[],
  conn: Awaited<ReturnType<ReturnType<typeof getPool>['getConnection']>>,
) {
  // Паттерн дефолтных названий — такие команды не сохраняем.
  const defaultNamePattern = /^Команда \d+$/

  for (const team of teams) {
    const teamName = team.name.trim()

    // Пропускаем дефолтные названия и пустые.
    if (!teamName || defaultNamePattern.test(teamName)) continue

    // Используем реальные очки набранные за матчи турнира (3 за победу, 1 за ничью).
    const placePoints = team.tournamentPoints ?? 0

    // Проверяем, существует ли команда уже.
    const [existingRows] = await conn.query(
      'SELECT id, tournament_count, points, wins, draws, losses, goals_scored, goals_conceded, trophies FROM teams WHERE name = ?',
      [teamName],
    ) as [Array<{ id: number; tournament_count: number; points: number; wins: number; draws: number; losses: number; goals_scored: number; goals_conceded: number; trophies: number }>, unknown]

    let teamId: number

    if (existingRows.length > 0 && existingRows[0]) {
      // Команда существует — обновляем статистику (накапливаем).
      const ex = existingRows[0]
      const trophiesToAdd = team.place === 1 ? 1 : 0

      await conn.query(
        `UPDATE teams SET
           tournament_count = tournament_count + 1,
           points           = points + ?,
           wins             = wins + ?,
           draws            = draws + ?,
           losses           = losses + ?,
           goals_scored     = goals_scored + ?,
           goals_conceded   = goals_conceded + ?,
           trophies         = trophies + ?
         WHERE id = ?`,
        [placePoints, team.wins, team.draws, team.losses, team.goalsScored, team.goalsConceded, trophiesToAdd, ex.id],
      )
      teamId = ex.id
    } else {
      // Команда новая — создаём.
      const initialTrophies = team.place === 1 ? 1 : 0
      const [insertResult] = await conn.query(
        `INSERT INTO teams (name, tournament_count, points, wins, draws, losses, goals_scored, goals_conceded, trophies)
         VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?)`,
        [teamName, placePoints, team.wins, team.draws, team.losses, team.goalsScored, team.goalsConceded, initialTrophies],
      ) as [{ insertId: number }, unknown]

      teamId = insertResult.insertId
    }

    // Сохраняем состав команды в team_players.
    const playerIds = team.players.filter((p) => p.id).map((p) => p.id)
    if (playerIds.length === 0) continue

    // Проверяем, кто из игроков уже в КАКОЙ-ЛИБО команде.
    const [existingInAnyTeam] = await conn.query(
      'SELECT player_id, team_id, tournament_count FROM team_players WHERE player_id IN (?)',
      [playerIds],
    ) as [Array<{ player_id: number; team_id: number; tournament_count: number }>, unknown]

    const existingMap = new Map(existingInAnyTeam.map((r) => [r.player_id, r]))

    const toInsert: Array<[number, number, string, string, string | null, number]> = []

    for (const player of team.players) {
      if (!player.id) continue
      // Сохраняем username без "@", чтобы в базе был один формат.
      player.username = normalizeUsername(player.username)
      const existing = existingMap.get(player.id)

      if (existing) {
        if (existing.team_id === teamId) {
          // Игрок уже в ЭТОЙ команде — увеличиваем tournament_count.
          await conn.query(
            'UPDATE team_players SET tournament_count = tournament_count + 1 WHERE team_id = ? AND player_id = ?',
            [teamId, player.id],
          )
        }
        // Если игрок в ДРУГОЙ команде — не трогаем (логика бота: смена только вручную).
      } else {
        // Новый игрок в команде — добавляем.
        toInsert.push([teamId, player.id, teamName, player.name || 'Unknown', player.username ?? null, 1])
      }
    }

    if (toInsert.length > 0) {
      await conn.query(
        'INSERT INTO team_players (team_id, player_id, team_name, name, username, tournament_count) VALUES ?',
        [toInsert],
      )
    }
  }
}
