import { describe, it, expect } from 'vitest'
import {
  topPlayerIds,
  topPlayerIdsByStat,
  tournamentRatingBonus,
} from '~/composables/tournament-standings/tournamentRatingBonus'

function stats(goals = 0, assists = 0, saves = 0) {
  return { goals, assists, saves, yellows: 0, reds: 0 }
}

describe('topPlayerIdsByStat', () => {
  const aggregate = {
    1: stats(3),
    2: stats(3),
    3: stats(1),
    4: stats(0, 5),
  }

  it('берёт максимум и при равенстве включает всех', () => {
    expect([...topPlayerIdsByStat(aggregate, 'goals')].sort()).toEqual([1, 2])
  })

  it('считает по каждому показателю отдельно', () => {
    expect([...topPlayerIdsByStat(aggregate, 'assists')]).toEqual([4])
  })

  it('никого не выбирает, если показатель у всех нулевой', () => {
    expect(topPlayerIdsByStat(aggregate, 'saves').size).toBe(0)
  })
})

describe('topPlayerIds', () => {
  it('объединяет лучших по голам, пасам и сейвам', () => {
    const aggregate = { 1: stats(2), 2: stats(0, 2), 3: stats(0, 0, 4), 4: stats(1) }
    expect([...topPlayerIds(aggregate)].sort()).toEqual([1, 2, 3])
  })
})

describe('tournamentRatingBonus', () => {
  const base = { isParticipant: true, isTournamentMvp: false, isTeamMvp: false, isTopPlayer: false }

  it('за явку даёт 0.2', () => {
    expect(tournamentRatingBonus(base)).toBe(0.2)
  })

  it('MVP турнира: явка плюс 2', () => {
    expect(tournamentRatingBonus({ ...base, isTournamentMvp: true })).toBe(2.2)
  })

  it('MVP команды: явка плюс 1', () => {
    expect(tournamentRatingBonus({ ...base, isTeamMvp: true })).toBe(1.2)
  })

  it('лучший в номинации: явка плюс 0.5', () => {
    expect(tournamentRatingBonus({ ...base, isTopPlayer: true })).toBe(0.7)
  })

  it('звания не складываются — берётся самое крупное', () => {
    expect(
      tournamentRatingBonus({ ...base, isTournamentMvp: true, isTeamMvp: true, isTopPlayer: true }),
    ).toBe(2.2)
    expect(tournamentRatingBonus({ ...base, isTeamMvp: true, isTopPlayer: true })).toBe(1.2)
  })

  it('кто не играл в турнире, не получает ничего', () => {
    expect(tournamentRatingBonus({ ...base, isParticipant: false, isTopPlayer: true })).toBe(0)
  })
})
