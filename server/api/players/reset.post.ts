import { getPool } from '../../utils/db'

export default defineEventHandler(async () => {
  try {
    const pool = getPool()

    // Обнуляем всю накопленную статистику игроков, чтобы начать "с чистого листа".
    const [playersResult] = await pool.query(
      `UPDATE players
       SET
         goals = 0,
         assists = 0,
         saves = 0,
         gamesPlayed = 0,
         wins = 0,
         draws = 0,
         losses = 0,
         rating = 0,
         mvp = 0,
         yellow_cards = 0`,
    )

    // Обнуляем накопленную статистику команд, чтобы тоже начать "с чистого листа".
    const [teamsResult] = await pool.query(
      `UPDATE teams
       SET
         tournament_count = 0,
         points = 0,
         wins = 0,
         draws = 0,
         losses = 0,
         goals_scored = 0,
         goals_conceded = 0,
         trophies = 0`,
    )

    // Очищаем историю привязок игроков к командам по турнирам.
    // Это нужно, чтобы статистика по составам не "накапливалась" после reset.
    const [teamPlayersResult] = await pool.query('DELETE FROM team_players')

    // Возвращаем ok + результаты (для дебага на клиенте).
    return { ok: true, playersResult, teamsResult, teamPlayersResult }
  } catch (err) {
    console.error('players/reset.post error:', err)
    throw createError({ statusCode: 500, statusMessage: 'Failed to reset players stats' })
  }
})

