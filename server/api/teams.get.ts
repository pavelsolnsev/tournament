import { queryWithRetry } from '../utils/db'

export default defineEventHandler(async () => {
  try {
    // Используем queryWithRetry — переподключается при обрыве соединения с MySQL.
    const rows = await queryWithRetry<unknown[]>(
      'SELECT id, name, tournament_count, points, wins, draws, losses, goals_scored, goals_conceded, trophies FROM teams ORDER BY name',
    )
    return Array.isArray(rows) ? rows : []
  } catch (err) {
    console.error('teams.get error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch teams',
    })
  }
})
