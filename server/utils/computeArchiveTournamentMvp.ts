// Считаем MVP архивного турнира так же, как при завершении (useFinishTournament + selectMvp).
// Нужно для списка архива без отдельной колонки в БД.
import type { SavedStandingsSnapshot } from '../../app/composables/useTournamentWizard'
import type { Player } from '../../app/types/tournament'
import { displayPlayerLabelWithoutRating } from '../../app/composables/usePlayerDisplay'
import { selectMvp, type MvpCandidate, type MvpTeamStat } from '../../app/composables/tournament-standings/mvp'

export type ArchiveMvpCard = {
  player_id: number
  name: string
  photo: string | null
}

// Разбираем снапшот и списки игроков — возвращаем null, если данных не хватает.
export function computeArchiveTournamentMvp(
  snapshot: SavedStandingsSnapshot,
  players: Player[],
  // После JSON.parse ключи id становятся строками — так и принимаем.
  assignmentByPlayerId: Record<string, string>,
): ArchiveMvpCard | null {
  if (!players.length) return null

  const playedMatchesList = snapshot.playedMatchesList ?? []
  const aggregatePlayerStats = snapshot.aggregatePlayerStats ?? {}
  const playerRatingDeltas = snapshot.playerRatingDeltas ?? {}
  const standingsRows = snapshot.standingsRows ?? []

  // Считаем личные победы/ничьи/поры из сыгранных матчей — как в buildPlayersPayload.
  const playerWDL: Record<number, { wins: number; draws: number; losses: number; games: number }> = {}

  for (const match of playedMatchesList) {
    const homeWin = match.homeGoals > match.awayGoals
    const draw = match.homeGoals === match.awayGoals

    for (const playerId of Object.keys(match.homeStats).map(Number)) {
      if (!playerWDL[playerId]) playerWDL[playerId] = { wins: 0, draws: 0, losses: 0, games: 0 }
      playerWDL[playerId].games += 1
      if (homeWin) playerWDL[playerId].wins += 1
      else if (draw) playerWDL[playerId].draws += 1
      else playerWDL[playerId].losses += 1
    }

    for (const playerId of Object.keys(match.awayStats).map(Number)) {
      if (!playerWDL[playerId]) playerWDL[playerId] = { wins: 0, draws: 0, losses: 0, games: 0 }
      playerWDL[playerId].games += 1
      if (!homeWin && !draw) playerWDL[playerId].wins += 1
      else if (draw) playerWDL[playerId].draws += 1
      else playerWDL[playerId].losses += 1
    }
  }

  const mvpCandidates: MvpCandidate[] = players.map((p) => {
    const stats = aggregatePlayerStats[p.id] ?? { goals: 0, assists: 0, saves: 0, yellows: 0 }
    const wdl = playerWDL[p.id] ?? { wins: 0, draws: 0, losses: 0, games: 0 }
    return {
      id: p.id,
      goals: stats.goals,
      assists: stats.assists,
      saves: stats.saves,
      wins: wdl.wins,
      yellows: stats.yellows,
      ratingDelta: playerRatingDeltas[p.id] ?? 0,
      baseRating: Number(p.rating ?? 0),
    }
  })

  const teamStats: MvpTeamStat[] = standingsRows.map((row) => ({
    teamName: row.teamName,
    wins: row.wins,
    draws: row.draws,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
  }))

  const tournamentMvp = selectMvp(mvpCandidates, {
    // selectMvp ждёт id как число — у объекта из JSON ключи строки, но доступ по числу работает.
    assignmentByPlayerId: assignmentByPlayerId as Record<number, string>,
    teamStats,
  })
  if (!tournamentMvp) return null

  const winnerPlayer = players.find((p) => p.id === tournamentMvp.id)
  if (!winnerPlayer) return null

  return {
    player_id: winnerPlayer.id,
    name: displayPlayerLabelWithoutRating(winnerPlayer),
    photo: winnerPlayer.photo ? String(winnerPlayer.photo).trim() || null : null,
  }
}
