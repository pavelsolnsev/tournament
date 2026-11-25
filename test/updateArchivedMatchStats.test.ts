import { describe, expect, it } from 'vitest'
import type { TournamentArchiveSnapshot } from '../app/types/tournamentArchive'
import { archiveMatchVersion } from '../app/utils/archiveMatchStats'
import { updateArchivedMatchStats } from '../server/utils/updateArchivedMatchStats'

const stats = (goals: number, saves = 0) => ({ goals, assists: 0, saves, yellows: 0, reds: 0 })
const row = (teamName: string, place: number) => ({
  teamName, place, played: 1, wins: 0, draws: 1, losses: 0, points: 1, goalsFor: 1, goalsAgainst: 1, goalDiff: 0,
})
const players = [{ id: 1, name: 'Иван', username: null }, { id: 2, name: 'Пётр', username: null }]
const assignment = { 1: 'А', 2: 'Б' }
const match = {
  matchNumber: 1, homeTeam: 'А', awayTeam: 'Б', homeGoals: 1, awayGoals: 1,
  homeStats: { 1: stats(0) }, awayStats: { 2: stats(1) },
  homePlayers: [], awayPlayers: [{ playerId: 2, name: 'Пётр', eventsLabel: '⚽ 1' }],
}
const snapshot: TournamentArchiveSnapshot = {
  playedMatchesList: [match], standingsRows: [row('А', 1), row('Б', 2)],
  aggregatePlayerStats: { 1: stats(0), 2: stats(1) },
  playerRatingDeltas: { 1: 0.5 }, tournamentRatingDeltas: { 1: 2.7 },
}

describe('archive match statistics', () => {
  it('preserves unassigned goals and updates the score, marks, standings and tournament totals', () => {
    const next = updateArchivedMatchStats(snapshot, players, assignment, {
      matchNumber: 1, version: archiveMatchVersion(match), homeStats: { 1: stats(1, 3) }, awayStats: {},
    })
    expect(next.playedMatchesList[0]).toMatchObject({ homeGoals: 2, awayGoals: 1, homePlayers: [{ playerId: 1, eventsLabel: '⚽ 1 🧤 3' }] })
    expect(next.aggregatePlayerStats).toEqual({ 1: stats(1, 3), 2: stats(1) })
    expect(next.standingsRows[0]).toMatchObject({ teamName: 'А', wins: 1, draws: 0, points: 3, played: 1 })
    expect(next.standingsRows[1]).toMatchObject({ teamName: 'Б', losses: 1, draws: 0, points: 0, played: 1 })
    expect(next.tournamentRatingDeltas).toEqual(snapshot.tournamentRatingDeltas)
    expect(snapshot.standingsRows[0]?.points).toBe(1)
  })

  it('uses legacy event labels to recover individual stats', () => {
    const legacy = { ...match, awayStats: {} }
    const next = updateArchivedMatchStats({ ...snapshot, aggregatePlayerStats: {}, playedMatchesList: [legacy] }, players, assignment, {
      matchNumber: 1, version: archiveMatchVersion(legacy), homeStats: {}, awayStats: { 2: stats(1, 1) },
    })
    expect(next.playedMatchesList[0]?.awayGoals).toBe(1)
    expect(next.aggregatePlayerStats[2]).toEqual(stats(1, 1))
  })

  it('rejects stale versions and edits on the wrong side', () => {
    const body = { matchNumber: 1, version: archiveMatchVersion(match), homeStats: { 2: stats(1) }, awayStats: {} }
    expect(() => updateArchivedMatchStats(snapshot, players, assignment, body)).toThrow(expect.objectContaining({ statusCode: 400 }))
    expect(() => updateArchivedMatchStats(snapshot, players, assignment, { ...body, version: 'old' })).toThrow(expect.objectContaining({ statusCode: 409 }))
  })
})
