import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import type { SavedStandingsSnapshot } from '../app/composables/tournament-wizard/savedContextTypes'
import type { PlayedMatch, PlayerMatchStats } from '../app/composables/tournament-standings/types'
import type { StandingsRow } from '../app/components/organisms/standings/Table.vue'
import {
  matchStatusAfterAdopt,
  syncFromRemoteSnapshot,
  type StandingsSyncRefs,
} from '../app/composables/tournament-standings/remoteSync'

function row(teamName: string, played: number, points: number): StandingsRow {
  return { place: 1, teamName, played, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points }
}

function played(matchNumber: number, homeTeam: string, awayTeam: string): PlayedMatch {
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

function stats(goals: number): PlayerMatchStats {
  return { goals, assists: 0, saves: 0, yellows: 0 }
}

/** Локальный экран таблицы: идёт «Красные — Жёлтые», один сыгранный матч позади. */
function localRefs(overrides: Partial<Record<string, unknown>> = {}): StandingsSyncRefs {
  return {
    standingsRows: ref<StandingsRow[]>([row('Красные', 1, 3)]),
    playedMatchesList: ref<PlayedMatch[]>([played(1, 'Красные', 'Синие')]),
    aggregatePlayerStats: ref<Record<number, PlayerMatchStats>>({}),
    playerRatingDeltas: ref<Record<number, number>>({}),
    matchCount: ref(1),
    teamGamesCount: ref<Record<string, number>>({}),
    consecutiveGames: ref<Record<string, number>>({}),
    matchHistory: ref<Record<string, Record<string, number>>>({}),
    lastMatchIndex: ref<Record<string, Record<string, number>>>({}),
    playedSingleMatch: ref(false),
    homeTeam: ref('Красные'),
    awayTeam: ref('Жёлтые'),
    homeAdded: ref<Record<number, PlayerMatchStats>>({ 5: stats(1) }),
    awayAdded: ref<Record<number, PlayerMatchStats>>({}),
    homeRemoved: ref<Record<number, PlayerMatchStats>>({}),
    awayRemoved: ref<Record<number, PlayerMatchStats>>({}),
    matchFinalized: ref(false),
    historyRev: ref(1),
    ...(overrides as object),
  } as StandingsSyncRefs
}

/** Снапшот из БД: те же поля, что пишет мастер. */
function remoteSnapshot(partial: Partial<SavedStandingsSnapshot>): SavedStandingsSnapshot {
  return {
    standingsRows: [row('Красные', 1, 3)],
    playedMatchesList: [played(1, 'Красные', 'Синие')],
    aggregatePlayerStats: {},
    matchCount: 1,
    teamGamesCount: {},
    consecutiveGames: {},
    matchHistory: {},
    lastMatchIndex: {},
    playedSingleMatch: false,
    playerRatingDeltas: {},
    currentHomeTeam: 'Красные',
    currentAwayTeam: 'Жёлтые',
    currentHomeStats: {},
    currentAwayStats: {},
    historyRev: 1,
    ...partial,
  }
}

describe('syncFromRemoteSnapshot', () => {
  it('без данных с сервера ничего не делает', () => {
    const refs = localRefs()
    expect(syncFromRemoteSnapshot(refs, null)).toBe('none')
  })

  it('подмешивает отметки судьи в тот же матч, свои не теряет', () => {
    const refs = localRefs()
    const remote = remoteSnapshot({ currentHomeStatsAdded: { 7: stats(1) } })

    expect(syncFromRemoteSnapshot(refs, remote)).toBe('stats')
    expect(refs.homeAdded.value).toEqual({ 5: stats(1), 7: stats(1) })
  })

  it('одинаковые отметки — не трогаем состояние, лишних сохранений нет', () => {
    const refs = localRefs()
    const remote = remoteSnapshot({ currentHomeStatsAdded: { 5: stats(1) } })

    expect(syncFromRemoteSnapshot(refs, remote)).toBe('none')
  })

  it('чужая правка доезжает: снятая на другом устройстве отметка не воскресает', () => {
    const refs = localRefs()
    const remote = remoteSnapshot({
      currentHomeStatsAdded: { 5: stats(1) },
      currentHomeStatsRemoved: { 5: stats(1) },
    })

    expect(syncFromRemoteSnapshot(refs, remote)).toBe('stats')
    expect(refs.homeAdded.value).toEqual({ 5: stats(1) })
    expect(refs.homeRemoved.value).toEqual({ 5: stats(1) })
  })

  it('старое состояние без карт добавили-сняли читается как добавленное', () => {
    const refs = localRefs()
    const remote = remoteSnapshot({ currentHomeStats: { 9: stats(2) } })

    expect(syncFromRemoteSnapshot(refs, remote)).toBe('stats')
    expect(refs.homeAdded.value).toEqual({ 5: stats(1), 9: stats(2) })
  })
})

describe('syncFromRemoteSnapshot — история матчей', () => {
  it('на другом устройстве завершили матч: принимаем историю и переходим к новой паре', () => {
    const refs = localRefs()
    const remote = remoteSnapshot({
      standingsRows: [row('Красные', 2, 6)],
      playedMatchesList: [played(1, 'Красные', 'Синие'), played(2, 'Красные', 'Жёлтые')],
      matchCount: 2,
      historyRev: 2,
      currentHomeTeam: 'Синие',
      currentAwayTeam: 'Жёлтые',
      currentHomeStats: {},
    })

    expect(syncFromRemoteSnapshot(refs, remote)).toBe('adopt')
    expect(refs.playedMatchesList.value.length).toBe(2)
    expect(refs.homeTeam.value).toBe('Синие')
    expect(refs.awayTeam.value).toBe('Жёлтые')
    expect(refs.homeAdded.value).toEqual({})
    expect(refs.historyRev.value).toBe(2)
  })

  it('чужая правка истории при той же паре: свои отметки текущего матча остаются', () => {
    const refs = localRefs()
    const remote = remoteSnapshot({
      playedMatchesList: [],
      standingsRows: [row('Красные', 0, 0)],
      matchCount: 0,
      historyRev: 4,
      currentHomeStatsAdded: { 7: stats(1) },
    })

    expect(syncFromRemoteSnapshot(refs, remote)).toBe('adopt')
    expect(refs.playedMatchesList.value.length).toBe(0)
    expect(refs.homeTeam.value).toBe('Красные')
    expect(refs.homeAdded.value).toEqual({ 5: stats(1), 7: stats(1) })
  })

  it('своя история новее: чужой устаревший снапшот не откатывает экран', () => {
    const refs = localRefs({ historyRev: ref(5) })
    const remote = remoteSnapshot({ playedMatchesList: [], matchCount: 0, historyRev: 2 })

    expect(syncFromRemoteSnapshot(refs, remote)).toBe('none')
    expect(refs.playedMatchesList.value.length).toBe(1)
  })
})

describe('matchStatusAfterAdopt', () => {
  it('судья нажал «показать итоги» — матч остаётся завершённым, а не уходит на выбор пары', () => {
    // На другом устройстве матч завершён: пара в снапшоте уже пустая, итоговая пара — в статусе.
    expect(
      matchStatusAfterAdopt(
        { matchStatus: 'finished', liveHomeTeam: 'Красные', liveAwayTeam: 'Жёлтые' },
        '',
        '',
      ),
    ).toEqual(['finished', 'Красные', 'Жёлтые'])
  })

  it('на сервере идёт матч и пара принята — сообщаем live с этой парой', () => {
    expect(
      matchStatusAfterAdopt({ matchStatus: 'live' }, 'Синие', 'Жёлтые'),
    ).toEqual(['live', 'Синие', 'Жёлтые'])
  })

  it('пары нет и матч не завершали — обычный выбор следующей пары', () => {
    expect(matchStatusAfterAdopt({ matchStatus: 'upcoming' }, '', '')).toEqual(['upcoming', '', ''])
    expect(matchStatusAfterAdopt(null, '', '')).toEqual(['upcoming', '', ''])
  })
})
