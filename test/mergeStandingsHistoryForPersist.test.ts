import { describe, it, expect } from 'vitest'
import {
  mergeStandingsHistoryIntoNextState,
  standingsHistoryRev,
} from '../server/utils/mergeStandingsHistoryForPersist'

/** Сыгранный матч в снапшоте — для теста важны только номер и команды. */
function playedMatch(matchNumber: number, homeTeam: string, awayTeam: string) {
  return {
    matchNumber,
    homeTeam,
    awayTeam,
    homeGoals: 1,
    awayGoals: 0,
    homePlayers: [],
    awayPlayers: [],
    homeStats: {},
    awayStats: {},
  }
}

/** Состояние турнира в БД: два сыгранных матча, идёт третий. */
function prevStateWithTwoPlayed() {
  return {
    matchStatus: 'live',
    liveHomeTeam: 'Красные',
    liveAwayTeam: 'Жёлтые',
    standingsSnapshot: {
      standingsRows: [{ place: 1, teamName: 'Красные', played: 2, wins: 2, draws: 0, losses: 0, goalsFor: 4, goalsAgainst: 1, goalDiff: 3, points: 6 }],
      playedMatchesList: [playedMatch(1, 'Красные', 'Синие'), playedMatch(2, 'Синие', 'Жёлтые')],
      aggregatePlayerStats: { 5: { goals: 2, assists: 0, saves: 0, yellows: 0 } },
      playerRatingDeltas: { 5: 0.4 },
      matchCount: 2,
      teamGamesCount: { Красные: 1, Синие: 2, Жёлтые: 1 },
      consecutiveGames: {},
      matchHistory: {},
      lastMatchIndex: {},
      playedSingleMatch: false,
      currentHomeTeam: 'Красные',
      currentAwayTeam: 'Жёлтые',
      currentHomeStats: { 5: { goals: 1, assists: 0, saves: 0, yellows: 0 } },
      currentAwayStats: {},
      historyRev: 2,
    },
  } as Record<string, unknown>
}

/** Тело PUT с устройства, которое ещё не увидело второй сыгранный матч. */
function staleClientState(overrides: Record<string, unknown> = {}) {
  return {
    matchStatus: 'live',
    liveHomeTeam: 'Синие',
    liveAwayTeam: 'Жёлтые',
    standingsSnapshot: {
      standingsRows: [{ place: 1, teamName: 'Красные', played: 1, wins: 1, draws: 0, losses: 0, goalsFor: 2, goalsAgainst: 1, goalDiff: 1, points: 3 }],
      playedMatchesList: [playedMatch(1, 'Красные', 'Синие')],
      aggregatePlayerStats: {},
      playerRatingDeltas: {},
      matchCount: 1,
      teamGamesCount: { Красные: 1, Синие: 1 },
      consecutiveGames: {},
      matchHistory: {},
      lastMatchIndex: {},
      playedSingleMatch: false,
      currentHomeTeam: 'Синие',
      currentAwayTeam: 'Жёлтые',
      currentHomeStats: { 7: { goals: 1, assists: 0, saves: 0, yellows: 0 } },
      currentAwayStats: {},
      historyRev: 1,
      ...overrides,
    },
  } as Record<string, unknown>
}

type Snap = Record<string, unknown>

describe('standingsHistoryRev', () => {
  it('берёт максимум из поля и числа сыгранных матчей', () => {
    expect(standingsHistoryRev({ playedMatchesList: [1, 2, 3] })).toBe(3)
    expect(standingsHistoryRev({ historyRev: 5, playedMatchesList: [1, 2] })).toBe(5)
    expect(standingsHistoryRev(null)).toBe(0)
  })
})

describe('mergeStandingsHistoryIntoNextState', () => {
  it('отставшее устройство не откатывает список сыгранных матчей и таблицу', () => {
    const prev = prevStateWithTwoPlayed()
    const next = staleClientState()

    mergeStandingsHistoryIntoNextState(prev, next)

    const snap = next.standingsSnapshot as Snap
    expect((snap.playedMatchesList as unknown[]).length).toBe(2)
    expect(snap.matchCount).toBe(2)
    expect(snap.historyRev).toBe(2)
    expect(snap.aggregatePlayerStats).toEqual({ 5: { goals: 2, assists: 0, saves: 0, yellows: 0 } })
  })

  it('у отставшего устройства старая пара — текущий матч и статус берём из БД', () => {
    const prev = prevStateWithTwoPlayed()
    const next = staleClientState()

    mergeStandingsHistoryIntoNextState(prev, next)

    const snap = next.standingsSnapshot as Snap
    expect(snap.currentHomeTeam).toBe('Красные')
    expect(snap.currentAwayTeam).toBe('Жёлтые')
    expect(next.liveHomeTeam).toBe('Красные')
    expect(next.liveAwayTeam).toBe('Жёлтые')
  })

  it('пара совпадает — отметки текущего матча остаются клиентскими', () => {
    const prev = prevStateWithTwoPlayed()
    const next = staleClientState({ currentHomeTeam: 'Красные', currentAwayTeam: 'Жёлтые' })

    mergeStandingsHistoryIntoNextState(prev, next)

    const snap = next.standingsSnapshot as Snap
    expect(snap.currentHomeStats).toEqual({ 7: { goals: 1, assists: 0, saves: 0, yellows: 0 } })
    expect((snap.playedMatchesList as unknown[]).length).toBe(2)
  })

  it('осознанное удаление сыгранного матча проходит: версия истории выросла', () => {
    const prev = prevStateWithTwoPlayed()
    const next = staleClientState({ historyRev: 3 })

    mergeStandingsHistoryIntoNextState(prev, next)

    const snap = next.standingsSnapshot as Snap
    expect((snap.playedMatchesList as unknown[]).length).toBe(1)
    expect(snap.historyRev).toBe(3)
  })

  it('одинаковая версия истории — состояние клиента не трогаем', () => {
    const prev = prevStateWithTwoPlayed()
    const next = staleClientState({
      playedMatchesList: [playedMatch(1, 'Красные', 'Синие'), playedMatch(2, 'Синие', 'Жёлтые')],
      historyRev: 2,
      matchCount: 9,
    })

    mergeStandingsHistoryIntoNextState(prev, next)

    expect((next.standingsSnapshot as Snap).matchCount).toBe(9)
  })
})

describe('mergeStandingsHistoryIntoNextState — отметки не переезжают между матчами', () => {
  /** В БД: 3 матча сыграно, идёт четвёртый «РФОИ — Ясность», отметок пока нет. */
  function prevStateMatch4() {
    return {
      matchStatus: 'live',
      liveHomeTeam: 'РФОИ',
      liveAwayTeam: 'Ясность',
      standingsSnapshot: {
        standingsRows: [],
        playedMatchesList: [playedMatch(1, 'A', 'B'), playedMatch(2, 'B', 'C'), playedMatch(3, 'Ясность', 'A')],
        aggregatePlayerStats: {},
        playerRatingDeltas: {},
        matchCount: 3,
        teamGamesCount: {},
        consecutiveGames: {},
        matchHistory: {},
        lastMatchIndex: {},
        playedSingleMatch: false,
        currentHomeTeam: 'РФОИ',
        currentAwayTeam: 'Ясность',
        currentHomeStats: {},
        currentAwayStats: {},
        currentHomeStatsAdded: {},
        currentHomeStatsRemoved: {},
        currentAwayStatsAdded: {},
        currentAwayStatsRemoved: {},
        historyRev: 3,
      },
    } as Record<string, unknown>
  }

  /** Тело PUT с устройства, которое ещё живёт в третьем матче со своими отметками. */
  function staleClientOnMatch3() {
    return {
      matchStatus: 'live',
      liveHomeTeam: 'Ясность',
      liveAwayTeam: 'A',
      standingsSnapshot: {
        standingsRows: [],
        playedMatchesList: [playedMatch(1, 'A', 'B'), playedMatch(2, 'B', 'C')],
        aggregatePlayerStats: {},
        playerRatingDeltas: {},
        matchCount: 2,
        teamGamesCount: {},
        consecutiveGames: {},
        matchHistory: {},
        lastMatchIndex: {},
        playedSingleMatch: false,
        currentHomeTeam: 'Ясность',
        currentAwayTeam: 'A',
        currentHomeStats: { 77: { goals: 1, assists: 0, saves: 0, yellows: 0 } },
        currentAwayStats: { 88: { goals: 1, assists: 0, saves: 0, yellows: 0 } },
        currentHomeStatsAdded: { 77: { goals: 1, assists: 0, saves: 0, yellows: 0 } },
        currentHomeStatsRemoved: {},
        currentAwayStatsAdded: { 88: { goals: 1, assists: 0, saves: 0, yellows: 0 } },
        currentAwayStatsRemoved: {},
        historyRev: 2,
      },
    } as Record<string, unknown>
  }

  it('сырые счётчики отставшего устройства не приклеиваются к новому матчу', () => {
    const next = staleClientOnMatch3()

    mergeStandingsHistoryIntoNextState(prevStateMatch4(), next)

    const snap = next.standingsSnapshot as Snap
    expect(snap.currentHomeTeam).toBe('РФОИ')
    expect(snap.currentAwayTeam).toBe('Ясность')
    // Ровно этот случай ломал турнир: пара уезжала из БД, а счётчики оставались клиентские.
    expect(snap.currentHomeStatsAdded).toEqual({})
    expect(snap.currentAwayStatsAdded).toEqual({})
    expect(snap.currentHomeStats).toEqual({})
    expect(snap.currentAwayStats).toEqual({})
  })

  it('в БД старый формат без сырых счётчиков — клиентские не остаются', () => {
    const prev = prevStateMatch4()
    const prevSnap = prev.standingsSnapshot as Snap
    Reflect.deleteProperty(prevSnap, 'currentHomeStatsAdded')
    Reflect.deleteProperty(prevSnap, 'currentAwayStatsAdded')
    Reflect.deleteProperty(prevSnap, 'currentHomeStatsRemoved')
    Reflect.deleteProperty(prevSnap, 'currentAwayStatsRemoved')

    const next = staleClientOnMatch3()
    mergeStandingsHistoryIntoNextState(prev, next)

    const snap = next.standingsSnapshot as Snap
    expect(snap.currentHomeStatsAdded).toBeUndefined()
    expect(snap.currentAwayStatsAdded).toBeUndefined()
  })

  it('пара та же — счётчики остаются клиентскими, их сольёт max-мёрж', () => {
    const prev = prevStateMatch4()
    const next = staleClientOnMatch3()
    const nextSnap = next.standingsSnapshot as Snap
    nextSnap.currentHomeTeam = 'РФОИ'
    nextSnap.currentAwayTeam = 'Ясность'

    mergeStandingsHistoryIntoNextState(prev, next)

    expect(nextSnap.currentHomeStatsAdded).toEqual({ 77: { goals: 1, assists: 0, saves: 0, yellows: 0 } })
  })
})
