import type { Ref } from 'vue'
import type { PlayerMatchStats, PlayedMatch } from './types'
import type { StandingsRow } from '~/components/organisms/standings/Table.vue'

/** Сброс результатов и отметок турнира — логика из useTournamentStandingsRefactored.resetTournamentMarks */
export function resetTournamentMarksState(
  params: { teams: string[] },
  standingsRows: Ref<StandingsRow[]>,
  matchCount: Ref<number>,
  teamGamesCount: Ref<Record<string, number>>,
  consecutiveGames: Ref<Record<string, number>>,
  matchHistory: Ref<Record<string, Record<string, number>>>,
  lastMatchIndex: Ref<Record<string, Record<string, number>>>,
  playedSingleMatch: Ref<boolean>,
  playedMatchesList: Ref<PlayedMatch[]>,
  aggregatePlayerStats: Ref<Record<number, PlayerMatchStats>>,
  playerRatingDeltas: Ref<Record<number, number>>,
  resetMatchStats: () => void,
  homeTeam: Ref<string>,
  awayTeam: Ref<string>,
) {
  standingsRows.value = params.teams.map((name, index) => ({
    place: index + 1,
    teamName: name,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0,
  }))

  matchCount.value = 0
  teamGamesCount.value = {}
  consecutiveGames.value = {}
  matchHistory.value = {}
  lastMatchIndex.value = {}
  playedSingleMatch.value = false
  playedMatchesList.value = []

  aggregatePlayerStats.value = {}
  playerRatingDeltas.value = {}

  resetMatchStats()
  homeTeam.value = ''
  awayTeam.value = ''
}
