import type { ComputedRef, Ref } from 'vue'
import type { Player } from '~/types/tournament'
import type { PlayerMatchStats, PlayedMatch } from './types'
import type { StandingsRow } from '~/components/organisms/standings/Table.vue'
import { extractMarkedPlayers } from './events'
import { recalibratePairingState, resetMatchHistoryIfBalanced } from './pairing'
import type { PairingState } from './pairing'
import { resortStandings, updateStandingsForTeam } from './standings'
import { mergeFinishedMatchIntoAggregate, subtractMatchFromAggregate } from './aggregateTournamentPlayerStats'
import { applyRatingDeltas, computeTeamRatingDeltas, revertRatingDeltas } from './ratings'
import { subtractPlayedMatchFromStandingsRows } from './subtractPlayedMatchFromStandingsRows'

export function updatePlayedMatchInList(args: {
  matchNumber: number
  newHomeGoals: number
  newAwayGoals: number
  newHomeStats: Record<number, PlayerMatchStats>
  newAwayStats: Record<number, PlayerMatchStats>
  playedMatchesList: Ref<PlayedMatch[]>
  standingsRows: Ref<StandingsRow[]>
  aggregatePlayerStats: Ref<Record<number, PlayerMatchStats>>
  playerRatingDeltas: Ref<Record<number, number>>
  playersById: ComputedRef<Record<number, Player>>
  displayPlayerLabelWithoutRating: (player: Player) => string
}) {
  const {
    matchNumber,
    newHomeGoals,
    newAwayGoals,
    newHomeStats,
    newAwayStats,
    playedMatchesList,
    standingsRows,
    aggregatePlayerStats,
    playerRatingDeltas,
    playersById,
    displayPlayerLabelWithoutRating,
  } = args

  const idx = playedMatchesList.value.findIndex((m) => m.matchNumber === matchNumber)
  if (idx === -1) return

  const old = playedMatchesList.value[idx]
  if (!old) return

  subtractPlayedMatchFromStandingsRows(standingsRows.value, old)

  updateStandingsForTeam(standingsRows, old.homeTeam, newHomeGoals, newAwayGoals)
  updateStandingsForTeam(standingsRows, old.awayTeam, newAwayGoals, newHomeGoals)

  const newHomePlayers = extractMarkedPlayers({
    statsRecord: newHomeStats,
    playersById: playersById.value,
    displayPlayerLabel: displayPlayerLabelWithoutRating,
  })
  const newAwayPlayers = extractMarkedPlayers({
    statsRecord: newAwayStats,
    playersById: playersById.value,
    displayPlayerLabel: displayPlayerLabelWithoutRating,
  })

  playedMatchesList.value[idx] = {
    ...old,
    homeGoals: newHomeGoals,
    awayGoals: newAwayGoals,
    homeStats: { ...newHomeStats },
    awayStats: { ...newAwayStats },
    homePlayers: newHomePlayers,
    awayPlayers: newAwayPlayers,
  }

  resortStandings(standingsRows, playedMatchesList.value)

  aggregatePlayerStats.value = subtractMatchFromAggregate(
    aggregatePlayerStats.value,
    old.homeStats,
    old.awayStats,
  )
  aggregatePlayerStats.value = mergeFinishedMatchIntoAggregate(
    aggregatePlayerStats.value,
    newHomeStats,
    newAwayStats,
  )

  const oldIsHomeDraw = old.homeGoals === old.awayGoals
  const oldIsHomeWin = old.homeGoals > old.awayGoals
  const oldHomeDeltas = computeTeamRatingDeltas({
    playersById: playersById.value,
    statsRecord: old.homeStats,
    isWin: oldIsHomeWin,
    isDraw: oldIsHomeDraw,
    isLose: !oldIsHomeWin && !oldIsHomeDraw,
    teamGoals: old.homeGoals,
    opponentGoals: old.awayGoals,
  })
  const oldAwayDeltas = computeTeamRatingDeltas({
    playersById: playersById.value,
    statsRecord: old.awayStats,
    isWin: !oldIsHomeWin && !oldIsHomeDraw,
    isDraw: oldIsHomeDraw,
    isLose: oldIsHomeWin,
    teamGoals: old.awayGoals,
    opponentGoals: old.homeGoals,
  })
  const newIsHomeDraw = newHomeGoals === newAwayGoals
  const newIsHomeWin = newHomeGoals > newAwayGoals
  const newHomeDeltas = computeTeamRatingDeltas({
    playersById: playersById.value,
    statsRecord: newHomeStats,
    isWin: newIsHomeWin,
    isDraw: newIsHomeDraw,
    isLose: !newIsHomeWin && !newIsHomeDraw,
    teamGoals: newHomeGoals,
    opponentGoals: newAwayGoals,
  })
  const newAwayDeltas = computeTeamRatingDeltas({
    playersById: playersById.value,
    statsRecord: newAwayStats,
    isWin: !newIsHomeWin && !newIsHomeDraw,
    isDraw: newIsHomeDraw,
    isLose: newIsHomeWin,
    teamGoals: newAwayGoals,
    opponentGoals: newHomeGoals,
  })
  revertRatingDeltas({ playerRatingDeltas, deltas: { ...oldHomeDeltas, ...oldAwayDeltas } })
  applyRatingDeltas({ playerRatingDeltas, deltas: { ...newHomeDeltas, ...newAwayDeltas } })
}

export function deletePlayedMatchFromList(args: {
  matchNumber: number
  playedMatchesList: Ref<PlayedMatch[]>
  standingsRows: Ref<StandingsRow[]>
  aggregatePlayerStats: Ref<Record<number, PlayerMatchStats>>
  playerRatingDeltas: Ref<Record<number, number>>
  pairingState: PairingState
  teams: string[]
  playersById: ComputedRef<Record<number, Player>>
}) {
  const {
    matchNumber,
    playedMatchesList,
    standingsRows,
    aggregatePlayerStats,
    playerRatingDeltas,
    pairingState,
    teams,
    playersById,
  } = args

  const idx = playedMatchesList.value.findIndex((m) => m.matchNumber === matchNumber)
  if (idx === -1) return

  const old = playedMatchesList.value[idx]
  if (!old) return

  subtractPlayedMatchFromStandingsRows(standingsRows.value, old)

  playedMatchesList.value.splice(idx, 1)

  playedMatchesList.value.forEach((m, i) => {
    m.matchNumber = i + 1
  })

  resortStandings(standingsRows, playedMatchesList.value)

  aggregatePlayerStats.value = subtractMatchFromAggregate(
    aggregatePlayerStats.value,
    old.homeStats,
    old.awayStats,
  )

  const delIsHomeDraw = old.homeGoals === old.awayGoals
  const delIsHomeWin = old.homeGoals > old.awayGoals
  const delHomeDeltas = computeTeamRatingDeltas({
    playersById: playersById.value,
    statsRecord: old.homeStats,
    isWin: delIsHomeWin,
    isDraw: delIsHomeDraw,
    isLose: !delIsHomeWin && !delIsHomeDraw,
    teamGoals: old.homeGoals,
    opponentGoals: old.awayGoals,
  })
  const delAwayDeltas = computeTeamRatingDeltas({
    playersById: playersById.value,
    statsRecord: old.awayStats,
    isWin: !delIsHomeWin && !delIsHomeDraw,
    isDraw: delIsHomeDraw,
    isLose: delIsHomeWin,
    teamGoals: old.awayGoals,
    opponentGoals: old.homeGoals,
  })
  revertRatingDeltas({ playerRatingDeltas, deltas: { ...delHomeDeltas, ...delAwayDeltas } })

  recalibratePairingState(
    pairingState,
    teams,
    playedMatchesList.value.map((m) => ({
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      matchNumber: m.matchNumber,
    })),
  )
  resetMatchHistoryIfBalanced(pairingState, teams)
}
