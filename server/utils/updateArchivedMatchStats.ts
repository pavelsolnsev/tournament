import { ref } from 'vue'
import { createError } from 'h3'
import type { Player } from '../../app/types/tournament'
import type { TournamentArchiveSnapshot } from '../../app/types/tournamentArchive'
import type { PlayedMatch, PlayerMatchStats } from '../../app/composables/tournament-standings/types'
import { archiveMatchScore, archiveMatchVersion, archiveSideStats, archiveStatKeys, type ArchivePlayerStats } from '../../app/utils/archiveMatchStats'
import { extractMarkedPlayers } from '../../app/composables/tournament-standings/events'
import { mergeFinishedMatchIntoAggregate, subtractMatchFromAggregate } from '../../app/composables/tournament-standings/aggregateTournamentPlayerStats'
import { resortStandings, updateStandingsForTeam } from '../../app/composables/tournament-standings/standings'
import { subtractPlayedMatchFromStandingsRows } from '../../app/composables/tournament-standings/subtractPlayedMatchFromStandingsRows'
import { displayPlayerLabelWithoutRating } from '../../app/composables/usePlayerDisplay'
import { normalizeTeamName } from '../../app/utils/teamNames'

function invalidStats() {
  return createError({ statusCode: 400, data: { message: 'Проверьте статистику и составы матча.' } })
}

function validateSide(input: unknown, own: ArchivePlayerStats, opposite: ArchivePlayerStats, assigned: Set<number>): ArchivePlayerStats {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw invalidStats()
  const stats: ArchivePlayerStats = { ...own }
  for (const [id, raw] of Object.entries(input)) {
    const playerId = Number(id)
    const allowed = Object.hasOwn(own, playerId) || (assigned.has(playerId) && !Object.hasOwn(opposite, playerId))
    if (!Number.isSafeInteger(playerId) || playerId <= 0 || !allowed || !raw || typeof raw !== 'object') throw invalidStats()
    const next = Object.fromEntries(archiveStatKeys.map(key => [key, (raw as Partial<PlayerMatchStats>)[key]]))
    if (Object.values(next).some(value => typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > 999)) throw invalidStats()
    stats[playerId] = next as PlayerMatchStats
  }
  return stats
}

export function updateArchivedMatchStats(
  snapshot: TournamentArchiveSnapshot,
  players: Player[],
  assignmentByPlayerId: Record<string, string>,
  body: { matchNumber?: unknown; version?: unknown; homeStats?: unknown; awayStats?: unknown },
) {
  const matches = snapshot.playedMatchesList
  if (!Number.isSafeInteger(body.matchNumber) || Number(body.matchNumber) <= 0) throw invalidStats()
  const current = matches.find(match => match.matchNumber === body.matchNumber)
  if (!current) throw createError({ statusCode: 404, data: { message: 'Матч не найден в архиве.' } })
  if (body.version !== archiveMatchVersion(current)) {
    throw createError({ statusCode: 409, data: { message: 'Матч уже изменили. Обновите страницу и откройте редактор заново.' } })
  }

  const homeBefore = archiveSideStats(current.homeStats, current.homePlayers)
  const awayBefore = archiveSideStats(current.awayStats, current.awayPlayers)
  const teamPlayers = (team: string) => new Set(players
    .filter(player => normalizeTeamName(assignmentByPlayerId[player.id] ?? '') === normalizeTeamName(team))
    .map(player => player.id))
  const homeStats = validateSide(body.homeStats, homeBefore, awayBefore, teamPlayers(current.homeTeam))
  const awayStats = validateSide(body.awayStats, awayBefore, homeBefore, teamPlayers(current.awayTeam))
  const playersById = Object.fromEntries(players.map(player => [player.id, player]))
  for (const player of [...(current.homePlayers ?? []), ...(current.awayPlayers ?? [])]) {
    playersById[player.playerId] ??= { id: player.playerId, name: player.name, username: null }
  }
  const marks = (statsRecord: ArchivePlayerStats) => extractMarkedPlayers({ statsRecord, playersById, displayPlayerLabel: displayPlayerLabelWithoutRating })
  const updated: PlayedMatch = {
    ...current,
    homeStats,
    awayStats,
    homeGoals: archiveMatchScore(current.homeGoals, homeBefore, homeStats),
    awayGoals: archiveMatchScore(current.awayGoals, awayBefore, awayStats),
    homePlayers: marks(homeStats),
    awayPlayers: marks(awayStats),
  }
  const playedMatchesList = matches.map(match => match === current ? updated : match)
  const standingsRows = ref(snapshot.standingsRows.map(row => ({ ...row })))
  const hasBothTeams = [current.homeTeam, current.awayTeam].every(team => standingsRows.value.some(row => row.teamName === team))
  if (hasBothTeams && (updated.homeGoals !== current.homeGoals || updated.awayGoals !== current.awayGoals)) {
    subtractPlayedMatchFromStandingsRows(standingsRows.value, current)
    updateStandingsForTeam(standingsRows, updated.homeTeam, updated.homeGoals, updated.awayGoals)
    updateStandingsForTeam(standingsRows, updated.awayTeam, updated.awayGoals, updated.homeGoals)
    resortStandings(standingsRows, playedMatchesList)
  }

  const aggregate = Object.keys(snapshot.aggregatePlayerStats ?? {}).length
    ? subtractMatchFromAggregate(snapshot.aggregatePlayerStats, homeBefore, awayBefore)
    : matches.filter(match => match !== current).reduce<ArchivePlayerStats>((stats, match) => mergeFinishedMatchIntoAggregate(
      stats, archiveSideStats(match.homeStats, match.homePlayers), archiveSideStats(match.awayStats, match.awayPlayers),
    ), {})

  return {
    ...snapshot,
    playedMatchesList,
    standingsRows: standingsRows.value,
    aggregatePlayerStats: mergeFinishedMatchIntoAggregate(aggregate, homeStats, awayStats),
  }
}
