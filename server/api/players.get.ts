import { getPool } from '../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const pool = getPool()
    const [rows] = await pool.query('SELECT id, name, username, goals, assists, saves, gamesPlayed, wins, draws, losses, rating, mvp, yellow_cards FROM players ORDER BY name')
    return Array.isArray(rows) ? rows : []
  } catch (err) {
    console.error('players.get error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch players',
    })
  }
})
