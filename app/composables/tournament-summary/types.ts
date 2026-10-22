import type { Player } from '~/types/tournament'
import type { RatingChanges } from '~/composables/tournament-summary/ratingAndGoalPlusAssist'
import type { PlayedMatch, PlayerMatchStats } from '~/composables/tournament-standings/types'
import type { StandingsRow } from '~/components/organisms/standings/Table.vue'

export type AwardWinner = {
  playerId: number
  name: string
  photo?: string | null
  teamName: string
  teamMarker: string
  value: number
  tournamentStats?: PlayerMatchStats
}

export type TeamMvp = {
  teamName: string
  teamMarker: string
  players: AwardWinner[]
  goals: number
  assists: number
  saves: number
}

export type TournamentSummaryStats = {
  totalMatches: number
  totalGoals: number
  totalAssists: number
  totalSaves: number
  avgGoalsPerMatch: number
  topScoringMatch: PlayedMatch | null
  topScoringMatchGoals: number
}

export type YellowCardPlayer = {
  playerId: number
  name: string
  photo?: string | null
  teamName: string
  teamMarker: string
  count: number
}

export type TournamentSummary = {
  mvp: AwardWinner[]
  topScorers: AwardWinner[]
  topAssisters: AwardWinner[]
  topGoalkeepers: AwardWinner[]
  /** Лучшие по сумме голов и передач. */
  topGoalPlusAssist: AwardWinner[]
  /** Рейтинг за турнир: кто больше всех прибавил и потерял. */
  ratingChanges: RatingChanges
  yellowCards: YellowCardPlayer[]
  teamMvps: TeamMvp[]
  stats: TournamentSummaryStats
  standingsRows: StandingsRow[]
}

export type SummaryParams = {
  players: Player[]
  assignmentByPlayerId: Record<number, string>
  aggregatePlayerStats: Record<number, PlayerMatchStats>
  playedMatchesList: PlayedMatch[]
  standingsRows: StandingsRow[]
  playerRatingDeltas: Record<number, number>
  /** Полное изменение рейтинга за турнир (с бонусами) — есть только в архивах после этой правки. */
  tournamentRatingDeltas?: Record<number, number>
  teamColors?: Record<string, number>
}
