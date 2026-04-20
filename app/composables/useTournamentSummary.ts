// Этот файл: composable для вычисления итогов турнира.
// Считает лучших игроков, статистику матчей и командные результаты.
import { useTeamColors } from '~/composables/useTeamColors'
import { displayPlayerLabelWithoutRating } from '~/composables/usePlayerDisplay'
import type { SummaryParams, TournamentSummary, YellowCardPlayer } from '~/composables/tournament-summary/types'
import type { PlayedMatch } from '~/composables/tournament-standings/types'
import {
  buildEffectiveTeamColors,
  findTeamMvp,
  findTopPlayers,
  findTournamentMvp,
  resolveTeamMarker,
} from '~/composables/tournament-summary/awardHelpers'

export type {
  AwardWinner,
  TeamMvp,
  TournamentSummaryStats,
  YellowCardPlayer,
  TournamentSummary,
} from '~/composables/tournament-summary/types'

export function useTournamentSummary(params: SummaryParams): TournamentSummary {
  const { getMarkerByIndex } = useTeamColors()
  const effectiveTeamColors = buildEffectiveTeamColors(
    params.teamColors,
    params.standingsRows,
    params.playedMatchesList,
  )

  const mvp = findTournamentMvp(
    params.players,
    params.assignmentByPlayerId,
    params.aggregatePlayerStats,
    params.playerRatingDeltas,
    params.standingsRows,
    effectiveTeamColors,
    getMarkerByIndex,
  )

  const topScorers = findTopPlayers(
    params.players,
    params.assignmentByPlayerId,
    params.aggregatePlayerStats,
    'goals',
    params.standingsRows,
    effectiveTeamColors,
    getMarkerByIndex,
  )

  const topAssisters = findTopPlayers(
    params.players,
    params.assignmentByPlayerId,
    params.aggregatePlayerStats,
    'assists',
    params.standingsRows,
    effectiveTeamColors,
    getMarkerByIndex,
  )

  const topGoalkeepers = findTopPlayers(
    params.players,
    params.assignmentByPlayerId,
    params.aggregatePlayerStats,
    'saves',
    params.standingsRows,
    effectiveTeamColors,
    getMarkerByIndex,
  )

  const uniqueTeams = [...new Set(Object.values(params.assignmentByPlayerId))]
  const teamMvps = uniqueTeams.map((teamName) => {
    const teamPlayers = params.players.filter(
      (p) => params.assignmentByPlayerId[p.id] === teamName,
    )
    const mvpPlayer = findTeamMvp(teamPlayers, params.aggregatePlayerStats, params.playerRatingDeltas)
    const stats = mvpPlayer
      ? (params.aggregatePlayerStats[mvpPlayer.id] ?? { goals: 0, assists: 0, saves: 0, yellows: 0 })
      : { goals: 0, assists: 0, saves: 0, yellows: 0 }

    const marker = resolveTeamMarker(teamName, params.standingsRows, effectiveTeamColors, getMarkerByIndex)

    const players = mvpPlayer
      ? [{
          playerId: mvpPlayer.id,
          name: displayPlayerLabelWithoutRating(mvpPlayer),
          photo: mvpPlayer.photo ?? null,
          teamName,
          teamMarker: marker,
          value: stats.goals,
        }]
      : []

    return {
      teamName,
      teamMarker: marker,
      players,
      goals: stats.goals,
      assists: stats.assists,
      saves: stats.saves,
    }
  })

  const totalMatches = params.playedMatchesList.length
  const totalGoals = params.playedMatchesList.reduce(
    (sum, m) => sum + m.homeGoals + m.awayGoals,
    0,
  )
  let totalAssists = 0
  let totalSaves = 0
  for (const s of Object.values(params.aggregatePlayerStats)) {
    totalAssists += s.assists ?? 0
    totalSaves += s.saves ?? 0
  }
  const avgGoalsPerMatch = totalMatches > 0
    ? Math.round((totalGoals / totalMatches) * 10) / 10
    : 0

  const topScoringMatch = params.playedMatchesList.reduce<PlayedMatch | null>((best, m) => {
    if (!best) return m
    const total = m.homeGoals + m.awayGoals
    const bestTotal = best.homeGoals + best.awayGoals
    return total > bestTotal ? m : best
  }, null)
  const topScoringMatchGoals = topScoringMatch
    ? topScoringMatch.homeGoals + topScoringMatch.awayGoals
    : 0

  const yellowCards: YellowCardPlayer[] = params.players
    .filter(p => (params.aggregatePlayerStats[p.id]?.yellows ?? 0) > 0)
    .map(p => {
      const teamName = params.assignmentByPlayerId[p.id] ?? ''
      const marker = resolveTeamMarker(teamName, params.standingsRows, effectiveTeamColors, getMarkerByIndex)
      return {
        playerId: p.id,
        name: displayPlayerLabelWithoutRating(p),
        photo: p.photo ?? null,
        teamName,
        teamMarker: marker,
        count: params.aggregatePlayerStats[p.id]?.yellows ?? 0,
      }
    })
    .sort((a, b) => b.count - a.count)

  return {
    mvp,
    topScorers,
    topAssisters,
    topGoalkeepers,
    yellowCards,
    teamMvps,
    stats: {
      totalMatches,
      totalGoals,
      totalAssists,
      totalSaves,
      avgGoalsPerMatch,
      topScoringMatch,
      topScoringMatchGoals,
    },
    standingsRows: params.standingsRows,
  }
}
