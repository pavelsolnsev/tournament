import type { SavedStandingsSnapshot } from '../../../app/composables/useTournamentWizard'
import type { Player } from '../../../app/types/tournament'
import { queryWithRetry } from '../../utils/db'
import { computeArchiveTournamentMvp } from '../../utils/computeArchiveTournamentMvp'
import { applyPlayerPhotosMap, fetchPlayerPhotosByIds } from '../../utils/mergePlayerPhotosFromDb'

// Строка из БД до обогащения — подтягиваем JSON для расчёта MVP.
type TournamentArchiveDbRow = {
  id: string
  tournament_name: string
  tournament_date: string
  venue_label: string
  format_label: string
  created_at: string
  champion_team_name: string | null
  snapshot: string | Buffer | object
  players: string | Buffer | object
  teams: string | Buffer | object
}

// Что отдаём на страницу архива — карточка турнира.
type TournamentArchiveListItem = {
  id: string
  tournament_name: string
  tournament_date: string
  venue_label: string
  format_label: string
  created_at: string
  champion_team_name: string | null
  mvp_player_id: number | null
  mvp_player_name: string | null
  mvp_photo: string | null
  mvp_team_name: string | null
}

// Парсим JSON из MySQL — приходит строкой или уже объектом.
function parseJsonField<T>(raw: string | Buffer | object): T | null {
  if (raw == null) return null
  if (typeof raw === 'object' && !Buffer.isBuffer(raw)) return raw as T
  const text = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw)
  if (!text.trim()) return null
  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

// Возвращает список завершённых турниров для страницы архива.
// Сортируем по дате убыванию — последний сыгранный идёт первым.
export default defineEventHandler(async () => {
  try {
    const rows = await queryWithRetry<TournamentArchiveDbRow[]>(
      `SELECT
         a.id,
         a.tournament_name,
         DATE_FORMAT(a.tournament_date, '%Y-%m-%d') AS tournament_date,
         a.venue_label,
         a.format_label,
         a.created_at,
         a.snapshot,
         a.players,
         a.teams,
         (
           SELECT jt.team_name
           FROM JSON_TABLE(
             CAST(a.snapshot AS JSON),
             '$.standingsRows[*]' COLUMNS (
               place_num INT PATH '$.place',
               team_name VARCHAR(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci PATH '$.teamName'
             )
           ) AS jt
           WHERE jt.place_num = 1
           LIMIT 1
         ) AS champion_team_name
       FROM tournament_archives a
       ORDER BY a.tournament_date DESC`,
    )

    if (!Array.isArray(rows)) return []

    const parsed = rows.map((row) => ({
      row,
      snapshot: parseJsonField<SavedStandingsSnapshot>(row.snapshot),
      players: parseJsonField<Player[]>(row.players),
      assignment: parseJsonField<Record<string, string>>(row.teams),
    }))

    const allPlayerIds: number[] = []
    for (const p of parsed) {
      for (const pl of p.players ?? []) {
        if (Number.isFinite(pl.id)) allPlayerIds.push(pl.id)
      }
    }
    const photoById = await fetchPlayerPhotosByIds(allPlayerIds)

    const out: TournamentArchiveListItem[] = []

    for (const { row, snapshot, players: playersRaw, assignment } of parsed) {
      let mvp_player_id: number | null = null
      let mvp_player_name: string | null = null
      let mvp_photo: string | null = null
      let mvp_team_name: string | null = null

      const players = playersRaw?.length ? applyPlayerPhotosMap(playersRaw, photoById) : (playersRaw ?? [])

      if (snapshot && players?.length && assignment && typeof assignment === 'object') {
        const mvp = computeArchiveTournamentMvp(snapshot, players, assignment)
        if (mvp) {
          mvp_player_id = mvp.player_id
          mvp_player_name = mvp.name
          mvp_photo = mvp.photo
          mvp_team_name = mvp.team_name || null
        }
      }

      out.push({
        id: row.id,
        tournament_name: row.tournament_name,
        tournament_date: row.tournament_date,
        venue_label: row.venue_label,
        format_label: row.format_label,
        created_at: row.created_at,
        champion_team_name: row.champion_team_name,
        mvp_player_id,
        mvp_player_name,
        mvp_photo,
        mvp_team_name,
      })
    }

    return out
  } catch (err) {
    console.error('[tournaments/index] error:', err)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch tournament archives' })
  }
})
