import type { ComputedRef, Ref } from 'vue'
import type { MarkedPlayer, PlayerMatchStats, PlayedMatch } from './types'
import type { StandingsRow } from '~/components/organisms/standings/Table.vue'
import type { Player } from '~/types/tournament'
import { recordFinishedMatch, resetMatchHistoryIfBalanced } from './pairing'
import type { PairingState } from './pairing'
import { resortStandings, updateStandingsForTeam } from './standings'
import { mergeFinishedMatchIntoAggregate } from './aggregateTournamentPlayerStats'
import { applyRatingDeltas, computeTeamRatingDeltas } from './ratings'

export function finishMatchAndRecord(args: {
  homeTeam: Ref<string>
  awayTeam: Ref<string>
  matchFinalized: Ref<boolean>
  homeGoals: ComputedRef<number>
  awayGoals: ComputedRef<number>
  homeStats: Ref<Record<number, PlayerMatchStats>>
  awayStats: Ref<Record<number, PlayerMatchStats>>
  standingsRows: Ref<StandingsRow[]>
  playedMatchesList: Ref<PlayedMatch[]>
  aggregatePlayerStats: Ref<Record<number, PlayerMatchStats>>
  playerRatingDeltas: Ref<Record<number, number>>
  pairingState: PairingState
  teams: string[]
  playersById: ComputedRef<Record<number, Player>>
  buildMarkedPlayers: (stats: Record<number, PlayerMatchStats>) => MarkedPlayer[]
  resetMatchStats: () => void
}) {
  const {
    homeTeam,
    awayTeam,
    matchFinalized,
    homeGoals,
    awayGoals,
    homeStats,
    awayStats,
    standingsRows,
    playedMatchesList,
    aggregatePlayerStats,
    playerRatingDeltas,
    pairingState,
    teams,
    playersById,
    buildMarkedPlayers,
    resetMatchStats,
  } = args

  if (!homeTeam.value || !awayTeam.value) return
  if (matchFinalized.value) return

  const hg = homeGoals.value
  const ag = awayGoals.value

  updateStandingsForTeam(standingsRows, homeTeam.value, hg, ag)
  updateStandingsForTeam(standingsRows, awayTeam.value, ag, hg)

  const homePlayers = buildMarkedPlayers(homeStats.value)
  const awayPlayers = buildMarkedPlayers(awayStats.value)

  const matchNumber = recordFinishedMatch(pairingState, homeTeam.value, awayTeam.value, teams)
  resetMatchHistoryIfBalanced(pairingState, teams)

  playedMatchesList.value.push({
    matchNumber,
    homeTeam: homeTeam.value,
    awayTeam: awayTeam.value,
    homeGoals: hg,
    awayGoals: ag,
    homePlayers,
    awayPlayers,
    homeStats: { ...homeStats.value },
    awayStats: { ...awayStats.value },
  })

  resortStandings(standingsRows, playedMatchesList.value)

  aggregatePlayerStats.value = mergeFinishedMatchIntoAggregate(
    aggregatePlayerStats.value,
    homeStats.value,
    awayStats.value,
  )

  const isHomeDraw = hg === ag
  const isHomeWin = hg > ag
  const homeDeltas = computeTeamRatingDeltas({
    playersById: playersById.value,
    statsRecord: homeStats.value,
    isWin: isHomeWin,
    isDraw: isHomeDraw,
    isLose: !isHomeWin && !isHomeDraw,
    teamGoals: hg,
    opponentGoals: ag,
  })
  const awayDeltas = computeTeamRatingDeltas({
    playersById: playersById.value,
    statsRecord: awayStats.value,
    isWin: !isHomeWin && !isHomeDraw,
    isDraw: isHomeDraw,
    isLose: isHomeWin,
    teamGoals: ag,
    opponentGoals: hg,
  })
  applyRatingDeltas({ playerRatingDeltas, deltas: { ...homeDeltas, ...awayDeltas } })

  resetMatchStats()
  homeTeam.value = ''
  awayTeam.value = ''
}
