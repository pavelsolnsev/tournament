import { describe, it, expect } from 'vitest'
import { getMatchProgress, plannedMatchesTotal } from '../app/composables/tournament-standings/plannedMatches'

describe('plannedMatchesTotal', () => {
  it('4 команды по 9 игр — 18 матчей', () => {
    expect(plannedMatchesTotal(4)).toBe(18)
  })

  it('3 команды по 8 игр — 12 матчей', () => {
    expect(plannedMatchesTotal(3)).toBe(12)
  })

  it('необычное число команд — плана нет', () => {
    expect(plannedMatchesTotal(2)).toBeNull()
    expect(plannedMatchesTotal(5)).toBeNull()
  })
})

describe('getMatchProgress', () => {
  it('в начале турнира — первый матч, обычная фаза', () => {
    expect(getMatchProgress(4, 0)).toEqual({ total: 18, current: 1, phase: 'regular' })
  })

  it('когда сыграно на один меньше плана — идёт последний матч', () => {
    expect(getMatchProgress(4, 17)).toEqual({ total: 18, current: 18, phase: 'last' })
    expect(getMatchProgress(3, 11)).toEqual({ total: 12, current: 12, phase: 'last' })
  })

  it('все матчи сыграны — фаза done, номер не выходит за план', () => {
    expect(getMatchProgress(3, 12)).toEqual({ total: 12, current: 12, phase: 'done' })
    expect(getMatchProgress(4, 25)).toEqual({ total: 18, current: 18, phase: 'done' })
  })

  it('без плана для числа команд — null', () => {
    expect(getMatchProgress(5, 3)).toBeNull()
  })
})
