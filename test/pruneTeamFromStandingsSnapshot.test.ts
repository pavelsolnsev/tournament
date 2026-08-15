// Тесты каскадного удаления команды из снапшота таблицы.
// Баг, который они закрывают: удалённая команда оставалась в таблице,
// а её матчи продолжали давать очки соперникам.
import { describe, it, expect } from 'vitest'
import { pruneTeamFromStandingsSnapshot } from '~/composables/tournament-standings/pruneTeamFromStandingsSnapshot'
import type { SavedStandingsSnapshot } from '~/composables/tournament-wizard/savedContextTypes'
import type { PlayedMatch, PlayerMatchStats } from '~/composables/tournament-standings/types'
import type { StandingsRow } from '~/components/organisms/standings/Table.vue'
import type { Player } from '~/types/tournament'

// Строка таблицы с заданной статистикой — остальное нулями.
function makeRow(teamName: string, over: Partial<StandingsRow> = {}): StandingsRow {
  return {
    place: 1,
    teamName,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0,
    ...over,
  }
}

function stat(over: Partial<PlayerMatchStats> = {}): PlayerMatchStats {
  return { goals: 0, assists: 0, saves: 0, yellows: 0, ...over }
}

function makeMatch(over: Partial<PlayedMatch> & Pick<PlayedMatch, 'matchNumber' | 'homeTeam' | 'awayTeam' | 'homeGoals' | 'awayGoals'>): PlayedMatch {
  return {
    homePlayers: [],
    awayPlayers: [],
    homeStats: {},
    awayStats: {},
    ...over,
  }
}

const players: Player[] = [
  { id: 1, name: 'Игрок 1', rating: 50 },
  { id: 2, name: 'Игрок 2', rating: 50 },
] as Player[]

const playersById: Record<number, Player> = { 1: players[0]!, 2: players[1]! }

// Снапшот: «Красные» обыграли «Синих» 3:1, «Синие» сыграли с «Зелёными» 0:0.
function makeSnapshot(): SavedStandingsSnapshot {
  return {
    standingsRows: [
      makeRow('Красные', { place: 1, played: 1, wins: 1, goalsFor: 3, goalsAgainst: 1, goalDiff: 2, points: 3 }),
      makeRow('Зелёные', { place: 2, played: 1, draws: 1, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 1 }),
      makeRow('Синие', { place: 3, played: 2, draws: 1, losses: 1, goalsFor: 1, goalsAgainst: 3, goalDiff: -2, points: 1 }),
    ],
    playedMatchesList: [
      makeMatch({
        matchNumber: 1,
        homeTeam: 'Красные',
        awayTeam: 'Синие',
        homeGoals: 3,
        awayGoals: 1,
        homeStats: { 1: stat({ goals: 3 }) },
        awayStats: { 2: stat({ goals: 1 }) },
      }),
      makeMatch({ matchNumber: 2, homeTeam: 'Синие', awayTeam: 'Зелёные', homeGoals: 0, awayGoals: 0 }),
    ],
    aggregatePlayerStats: { 1: stat({ goals: 3 }), 2: stat({ goals: 1 }) },
    matchCount: 2,
    teamGamesCount: { 'Красные': 1, 'Синие': 2, 'Зелёные': 1 },
    consecutiveGames: { 'Красные': 0, 'Синие': 1, 'Зелёные': 1 },
    matchHistory: {
      'Красные': { 'Синие': 1 },
      'Синие': { 'Красные': 1, 'Зелёные': 1 },
      'Зелёные': { 'Синие': 1 },
    },
    lastMatchIndex: {
      'Красные': { 'Синие': 1 },
      'Синие': { 'Красные': 1, 'Зелёные': 2 },
      'Зелёные': { 'Синие': 2 },
    },
    playedSingleMatch: false,
    playerRatingDeltas: { 1: 5, 2: -2 },
    currentHomeTeam: '',
    currentAwayTeam: '',
    currentHomeStats: {},
    currentAwayStats: {},
  }
}

describe('pruneTeamFromStandingsSnapshot', () => {
  it('убирает строку удалённой команды из таблицы', () => {
    const next = pruneTeamFromStandingsSnapshot({ snapshot: makeSnapshot(), teamName: 'Синие', playersById })!
    expect(next.standingsRows.map((r) => r.teamName).sort()).toEqual(['Зелёные', 'Красные'])
    // Места пересчитаны подряд, без дырки от удалённой строки.
    expect(next.standingsRows.map((r) => r.place)).toEqual([1, 2])
  })

  it('удаляет матчи команды и перенумеровывает оставшиеся', () => {
    const next = pruneTeamFromStandingsSnapshot({ snapshot: makeSnapshot(), teamName: 'Синие', playersById })!
    expect(next.playedMatchesList).toHaveLength(0)
    expect(next.matchCount).toBe(0)
  })

  it('откатывает очки и голы соперников за удалённые матчи', () => {
    const next = pruneTeamFromStandingsSnapshot({ snapshot: makeSnapshot(), teamName: 'Синие', playersById })!
    const red = next.standingsRows.find((r) => r.teamName === 'Красные')!
    const green = next.standingsRows.find((r) => r.teamName === 'Зелёные')!

    expect(red).toMatchObject({ played: 0, wins: 0, points: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0 })
    expect(green).toMatchObject({ played: 0, draws: 0, points: 0, goalsFor: 0, goalsAgainst: 0 })
  })

  it('вычитает статистику игроков за удалённые матчи', () => {
    const next = pruneTeamFromStandingsSnapshot({ snapshot: makeSnapshot(), teamName: 'Синие', playersById })!
    expect(next.aggregatePlayerStats[1]).toMatchObject({ goals: 0 })
    expect(next.aggregatePlayerStats[2]).toMatchObject({ goals: 0 })
  })

  it('чистит ключи команды в счётчиках подбора пар', () => {
    const next = pruneTeamFromStandingsSnapshot({ snapshot: makeSnapshot(), teamName: 'Синие', playersById })!
    expect(next.teamGamesCount).not.toHaveProperty('Синие')
    expect(next.consecutiveGames).not.toHaveProperty('Синие')
    expect(next.matchHistory).not.toHaveProperty('Синие')
    expect(next.lastMatchIndex).not.toHaveProperty('Синие')
    // Соперники тоже не должны помнить встречи с удалённой командой.
    expect(next.matchHistory['Красные'] ?? {}).not.toHaveProperty('Синие')
    expect(next.lastMatchIndex['Зелёные'] ?? {}).not.toHaveProperty('Синие')
  })

  it('сохраняет матчи и очки, не связанные с удалённой командой', () => {
    const snapshot = makeSnapshot()
    const next = pruneTeamFromStandingsSnapshot({ snapshot, teamName: 'Зелёные', playersById })!

    expect(next.playedMatchesList).toHaveLength(1)
    expect(next.playedMatchesList[0]).toMatchObject({ matchNumber: 1, homeTeam: 'Красные', awayTeam: 'Синие' })

    const red = next.standingsRows.find((r) => r.teamName === 'Красные')!
    expect(red).toMatchObject({ played: 1, wins: 1, points: 3, goalsFor: 3, goalsAgainst: 1 })
    // Ничья с «Зелёными» у «Синих» откатилась, поражение от «Красных» осталось.
    const blue = next.standingsRows.find((r) => r.teamName === 'Синие')!
    expect(blue).toMatchObject({ played: 1, draws: 0, losses: 1, points: 0 })
  })

  it('сбрасывает текущий матч, если в нём участвовала удалённая команда', () => {
    const snapshot = makeSnapshot()
    snapshot.currentHomeTeam = 'Синие'
    snapshot.currentAwayTeam = 'Зелёные'
    snapshot.currentHomeStats = { 2: stat({ goals: 1 }) }

    const next = pruneTeamFromStandingsSnapshot({ snapshot, teamName: 'Синие', playersById })!
    expect(next.currentHomeTeam).toBe('')
    expect(next.currentAwayTeam).toBe('')
    expect(next.currentHomeStats).toEqual({})
    expect(next.currentAwayStats).toEqual({})
  })

  it('не трогает текущий матч без удалённой команды', () => {
    const snapshot = makeSnapshot()
    snapshot.currentHomeTeam = 'Красные'
    snapshot.currentAwayTeam = 'Зелёные'

    const next = pruneTeamFromStandingsSnapshot({ snapshot, teamName: 'Синие', playersById })!
    expect(next.currentHomeTeam).toBe('Красные')
    expect(next.currentAwayTeam).toBe('Зелёные')
  })

  it('сравнивает имена без учёта лишних пробелов', () => {
    const next = pruneTeamFromStandingsSnapshot({ snapshot: makeSnapshot(), teamName: '  Синие  ', playersById })!
    expect(next.standingsRows.map((r) => r.teamName).sort()).toEqual(['Зелёные', 'Красные'])
  })

  it('не ломается на пустом снапшоте или пустом имени', () => {
    expect(pruneTeamFromStandingsSnapshot({ snapshot: null, teamName: 'Синие', playersById })).toBeNull()
    const snapshot = makeSnapshot()
    expect(pruneTeamFromStandingsSnapshot({ snapshot, teamName: '   ', playersById })).toBe(snapshot)
  })

  it('не мутирует исходный снапшот', () => {
    const snapshot = makeSnapshot()
    pruneTeamFromStandingsSnapshot({ snapshot, teamName: 'Синие', playersById })
    expect(snapshot.standingsRows).toHaveLength(3)
    expect(snapshot.playedMatchesList).toHaveLength(2)
  })
})
