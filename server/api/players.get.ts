import { queryWithRetry } from '../utils/db'

const BASE_COLUMNS =
  'id, name, username, photo, goals, assists, saves, gamesPlayed, wins, draws, losses, rating, mvp, yellow_cards'

export default defineEventHandler(async () => {
  try {
    // Используем queryWithRetry — переподключается при обрыве соединения с MySQL.
    // rating_trend (стрелка прогресса: 1 вырос, -1 упал) ведёт сайт rfoi; столбец есть только в боевой базе —
    // где его нет, повторяем запрос без него.
    let rows: unknown[]
    try {
      rows = await queryWithRetry<unknown[]>(
        `SELECT ${BASE_COLUMNS}, rating_trend AS ratingTrend FROM players ORDER BY name`,
      )
    } catch (err) {
      if ((err as { code?: string })?.code !== 'ER_BAD_FIELD_ERROR') throw err
      rows = await queryWithRetry<unknown[]>(`SELECT ${BASE_COLUMNS} FROM players ORDER BY name`)
    }
    return Array.isArray(rows) ? rows : []
  } catch (err) {
    console.error('players.get error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch players',
    })
  }
})
