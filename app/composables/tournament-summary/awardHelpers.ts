import type { Player } from '~/types/tournament'
import type { PlayedMatch, PlayerMatchStats } from '~/composables/tournament-standings/types'
import type { StandingsRow } from '~/components/organisms/standings/Table.vue'
import { displayPlayerLabelWithoutRating } from '~/composables/usePlayerDisplay'
import { normalizeTeamColorsMap, normalizeTeamName, resolveTeamColorIndex } from '~/utils/teamNames'
import { selectMvp } from '~/composables/tournament-standings/mvp'
import type { AwardWinner } from './types'

const TEAM_MARKERS_COUNT = 6

export function buildEffectiveTeamColors(
  teamColors: Record<string, number> | undefined,
  standingsRows: StandingsRow[],
  playedMatchesList: PlayedMatch[],
): Record<string, number> {
  const map = normalizeTeamColorsMap(teamColors)
  const ordered: string[] = []
  const seen = new Set<string>()

  for (const row of standingsRows) {
    const nk = normalizeTeamName(row.teamName)
    if (!nk || seen.has(nk)) continue
    seen.add(nk)
    ordered.push(nk)
  }

  for (const m of playedMatchesList) {
    for (const raw of [m.homeTeam, m.awayTeam]) {
      const nk = normalizeTeamName(raw)
      if (!nk || seen.has(nk)) continue
      seen.add(nk)
      ordered.push(nk)
    }
  }

  let next = 0
  for (const nk of ordered) {
    if (map[nk] !== undefined) continue
    map[nk] = next % TEAM_MARKERS_COUNT
    next += 1
  }

  return map
}

export function resolveTeamMarker(
  teamName: string,
  standingsRows: StandingsRow[],
  effectiveTeamColors: Record<string, number>,
  getMarkerByIndex: (i: number) => string,
): string {
  const rowIdx = standingsRows.findIndex((r) => normalizeTeamName(r.teamName) === normalizeTeamName(teamName))
  const fallback = rowIdx >= 0 ? rowIdx : 0
  const colorIdx = resolveTeamColorIndex(teamName, effectiveTeamColors, fallback)
  return getMarkerByIndex(colorIdx)
}

export function findTopPlayers(
  players: Player[],
  assignmentByPlayerId: Record<number, string>,
  aggregateStats: Record<number, PlayerMatchStats>,
  field: keyof PlayerMatchStats,
  standingsRows: StandingsRow[],
  effectiveTeamColors: Record<string, number>,
  getMarkerByIndex: (i: number) => string,
): AwardWinner[] {
  const withValue = players.map((p) => {
    const teamName = assignmentByPlayerId[p.id] ?? ''
    return {
      playerId: p.id,
      name: displayPlayerLabelWithoutRating(p),
      photo: p.photo ?? null,
      teamName,
      teamMarker: resolveTeamMarker(teamName, standingsRows, effectiveTeamColors, getMarkerByIndex),
      value: aggregateStats[p.id]?.[field] ?? 0,
    }
  }).filter((p) => p.value > 0)

  if (withValue.length === 0) return []

  const maxValue = Math.max(...withValue.map((p) => p.value))

  return withValue.filter((p) => p.value === maxValue)
}

export function findTeamMvp(
  teamPlayers: Player[],
  aggregateStats: Record<number, PlayerMatchStats>,
  playerRatingDeltas: Record<number, number>,
): Player | null {
  if (teamPlayers.length === 0) return null

  return teamPlayers.reduce<Player | null>((best, p) => {
    if (!best) return p
    const pStats = aggregateStats[p.id] ?? { goals: 0, assists: 0, saves: 0, yellows: 0 }
    const bStats = aggregateStats[best.id] ?? { goals: 0, assists: 0, saves: 0, yellows: 0 }

    const pMark = pStats.goals + pStats.assists + pStats.saves * 0.5
    const bMark = bStats.goals + bStats.assists + bStats.saves * 0.5

    if (pMark > bMark) return p
    if (pMark < bMark) return best

    if (pStats.goals > bStats.goals) return p
    if (pStats.goals < bStats.goals) return best

    const pDelta = playerRatingDeltas[p.id] ?? 0
    const bDelta = playerRatingDeltas[best.id] ?? 0
    if (pDelta > bDelta) return p
    if (pDelta < bDelta) return best

    return p.id < best.id ? p : best
  }, null)
}

export function findTournamentMvp(
  players: Player[],
  assignmentByPlayerId: Record<number, string>,
  aggregateStats: Record<number, PlayerMatchStats>,
  playerRatingDeltas: Record<number, number>,
  standingsRows: StandingsRow[],
  effectiveTeamColors: Record<string, number>,
  getMarkerByIndex: (i: number) => string,
): AwardWinner[] {
  if (players.length === 0) return []

  const teamStats = standingsRows.map((row) => ({
    teamName: row.teamName,
    wins: row.wins,
    draws: row.draws,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
  }))

  const candidates = players.map((p) => {
    const s = aggregateStats[p.id] ?? { goals: 0, assists: 0, saves: 0, yellows: 0 }
    return {
      id: p.id,
      goals: s.goals,
      assists: s.assists,
      saves: s.saves,
      wins: 0,
      yellows: s.yellows,
      ratingDelta: playerRatingDeltas[p.id] ?? 0,
      baseRating: Number(p.rating ?? 0),
    }
  })

  const winner = selectMvp(candidates, { assignmentByPlayerId, teamStats })
  if (!winner) return []

  const winnerPlayer = players.find((p) => p.id === winner.id)
  if (!winnerPlayer) return []

  const teamName = assignmentByPlayerId[winner.id] ?? ''
  const s = aggregateStats[winner.id] ?? { goals: 0, assists: 0, saves: 0, yellows: 0 }

  return [{
    playerId: winner.id,
    name: displayPlayerLabelWithoutRating(winnerPlayer),
    photo: winnerPlayer.photo ?? null,
    teamName,
    teamMarker: resolveTeamMarker(teamName, standingsRows, effectiveTeamColors, getMarkerByIndex),
    value: winner.goals,
    tournamentStats: { goals: s.goals, assists: s.assists, saves: s.saves, yellows: s.yellows },
  }]
}
