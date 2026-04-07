import { queryWithRetry } from '../../utils/db'

// Полная запись турнира из БД — с JSON-полями для восстановления итогов.
type TournamentArchiveFull = {
  id: string
  tournament_name: string
  tournament_date: string
  venue_label: string
  format_label: string
  snapshot: string
  players: string
  teams: string
  team_colors: string
  created_at: string
}

// Возвращает полные данные одного турнира по его UUID.
// Используется страницей /tournaments/[id] для отображения итогов.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  // Защита от пустого id — чтобы не делать запрос с WHERE id = ''.
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Tournament id is required' })
  }

  try {
    const rows = await queryWithRetry<TournamentArchiveFull[]>(
      `SELECT id, tournament_name, tournament_date, venue_label, format_label, snapshot, players, teams, team_colors, created_at
       FROM tournament_archives
       WHERE id = ?
       LIMIT 1`,
      [id],
    )

    const row = Array.isArray(rows) ? rows[0] : undefined

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Tournament not found' })
    }

    // MySQL возвращает JSON-поля как строки — парсим их перед отдачей клиенту.
    return {
      id: row.id,
      tournamentName: row.tournament_name,
      tournamentDate: row.tournament_date,
      venueLabel: row.venue_label ?? '',
      formatLabel: row.format_label ?? '',
      snapshot: typeof row.snapshot === 'string' ? JSON.parse(row.snapshot) : row.snapshot,
      players: typeof row.players === 'string' ? JSON.parse(row.players) : row.players,
      assignmentByPlayerId: typeof row.teams === 'string' ? JSON.parse(row.teams) : row.teams,
      teamColors: typeof row.team_colors === 'string' ? JSON.parse(row.team_colors) : row.team_colors,
      createdAt: row.created_at,
    }
  } catch (err: unknown) {
    // Если ошибка уже createError (404 выше) — прокидываем как есть.
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    console.error('[tournaments/[id]] error:', err)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch tournament' })
  }
})
