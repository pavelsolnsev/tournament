import type { StandingsRow } from '~/components/organisms/standings/Table.vue'
import type { PlayedMatch, PlayerMatchStats } from '~/composables/tournament-standings/types'
import type { Player } from '~/types/tournament'

/** Снимок турнира из tournament_archives.snapshot (после JSON.parse на сервере). */
export type TournamentArchiveSnapshot = {
  aggregatePlayerStats: Record<number, PlayerMatchStats>
  playedMatchesList: PlayedMatch[]
  standingsRows: StandingsRow[]
  playerRatingDeltas: Record<number, number>
}

/** Тело ответа GET /api/tournaments/:id — совпадает с server/api/tournaments/[id].get.ts. */
export type TournamentArchiveApiResponse = {
  id: string
  tournamentName: string
  tournamentDate: string
  venueLabel: string
  formatLabel: string
  createdAt: string
  players: Player[]
  snapshot: TournamentArchiveSnapshot
  /** Ключи из JSON могут быть строками — страница нормализует в Record<number, string>. */
  assignmentByPlayerId: Record<string, string | number>
  teamColors: Record<string, number>
}
