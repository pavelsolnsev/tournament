/** Строка списка архива — совпадает с ответом GET /api/tournaments. */
export type ArchiveListRow = {
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
