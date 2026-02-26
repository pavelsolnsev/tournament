import { getPool } from '../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const pool = getPool()
    const [rows] = await pool.query(
      'SELECT id, name, tournament_count, points, wins, draws, losses, goals_scored, goals_conceded, trophies FROM teams ORDER BY name'
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
