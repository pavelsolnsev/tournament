import type { MatchStatus } from '~/types/tournament'
import type { PlayedMatch, PlayerMatchStats } from '~/composables/tournament-standings/types'
import type { StandingsRow } from '~/components/organisms/standings/Table.vue'

/** Снапшот состояния турнирной таблицы — сохраняется отдельно при каждом изменении матчей. */
export type SavedStandingsSnapshot = {
  standingsRows: StandingsRow[]
  playedMatchesList: PlayedMatch[]
  aggregatePlayerStats: Record<number, PlayerMatchStats>
  matchCount: number
  teamGamesCount: Record<string, number>
  consecutiveGames: Record<string, number>
  matchHistory: Record<string, Record<string, number>>
  lastMatchIndex: Record<string, Record<string, number>>
  playedSingleMatch: boolean
  playerRatingDeltas: Record<number, number>
  currentHomeTeam: string
  currentAwayTeam: string
  currentHomeStats: Record<number, PlayerMatchStats>
  currentAwayStats: Record<number, PlayerMatchStats>
}

/** Полный контекст мастера — сериализуется в БД. */
export type SavedTournamentContext = {
  step: number
  tournamentName: string
  tournamentDate: string
  venueLabel: string
  formatLabel: string
  selectedIds: number[]
  /** id игроков с отметкой оплаты (синхрон с ВК через roster-snapshot и POST vk/player-paid). */
  paidPlayerIds?: number[]
  assignmentByPlayerId: Record<number, string>
  confirmedTeamNames: string[]
  teamColors: Record<string, number>
  standingsSnapshot: SavedStandingsSnapshot | null
  matchStatus: MatchStatus
  liveHomeTeam: string
  liveAwayTeam: string
}
