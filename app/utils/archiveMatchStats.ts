import type { MarkedPlayer, PlayedMatch, PlayerMatchStats } from '~/composables/tournament-standings/types'

export type ArchivePlayerStats = Record<number, PlayerMatchStats>
export type UpdateArchiveMatch = (match: PlayedMatch, homeStats: ArchivePlayerStats, awayStats: ArchivePlayerStats) => Promise<void>

const eventIcons = { goals: '⚽', assists: '🎯', saves: '🧤', yellows: '🟨', reds: '🟥' } as const
export const archiveStatKeys = Object.keys(eventIcons) as (keyof PlayerMatchStats)[]

export function archiveSideStats(stats: ArchivePlayerStats | undefined, marked: MarkedPlayer[] = []): ArchivePlayerStats {
  const result: ArchivePlayerStats = {}
  for (const player of marked) {
    const counts = {} as PlayerMatchStats
    for (const key of archiveStatKeys) {
      counts[key] = Number(player.eventsLabel?.match(new RegExp(`${eventIcons[key]}\\s*(\\d+)`))?.[1] ?? 0)
    }
    result[player.playerId] = counts
  }
  for (const [id, entry] of Object.entries(stats ?? {})) {
    result[Number(id)] = { goals: entry.goals ?? 0, assists: entry.assists ?? 0, saves: entry.saves ?? 0, yellows: entry.yellows ?? 0, reds: entry.reds ?? 0 }
  }
  return result
}

export function archiveMatchScore(score: number, previous: ArchivePlayerStats, next: ArchivePlayerStats) {
  const goals = (side: ArchivePlayerStats) => Object.values(side).reduce((sum, player) => sum + player.goals, 0)
  return Math.max(0, score + goals(next) - goals(previous))
}

export function archiveMatchVersion(match: PlayedMatch) {
  return JSON.stringify([
    match.homeGoals,
    match.awayGoals,
    archiveSideStats(match.homeStats, match.homePlayers),
    archiveSideStats(match.awayStats, match.awayPlayers),
  ])
}
