import { queryWithRetry } from '../../utils/db'

// Тип одной записи в списке архива — только то что нужно для карточки на странице.
type TournamentArchiveRow = {
  id: string
  tournament_name: string
  tournament_date: string
  venue_label: string
  format_label: string
  created_at: string
}

// Возвращает список завершённых турниров для страницы архива.
// Сортируем по дате убыванию — последний сыгранный идёт первым.
export default defineEventHandler(async () => {
  try {
    const rows = await queryWithRetry<TournamentArchiveRow[]>(
      `SELECT id, tournament_name, tournament_date, venue_label, format_label, created_at
       FROM tournament_archives
       ORDER BY tournament_date DESC`,
    )
    return Array.isArray(rows) ? rows : []
  } catch (err) {
    console.error('[tournaments/index] error:', err)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch tournament archives' })
  }
})
