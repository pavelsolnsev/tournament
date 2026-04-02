import { queryWithRetry } from '../utils/db'

export default defineEventHandler(async () => {
  try {
    // Используем queryWithRetry — переподключается при обрыве соединения с MySQL.
    const rows = await queryWithRetry<unknown[]>(
      'SELECT id, name, username, photo, goals, assists, saves, gamesPlayed, wins, draws, losses, rating, mvp, yellow_cards FROM players ORDER BY name',
    )
    return Array.isArray(rows) ? rows : []
  } catch (err) {
    console.error('players.get error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch players',
    })
  }
})
