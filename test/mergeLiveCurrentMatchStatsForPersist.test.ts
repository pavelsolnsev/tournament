import { describe, it, expect } from 'vitest'
import { mergeLiveCurrentMatchStatsIntoNextState } from '../server/utils/mergeLiveCurrentMatchStatsForPersist'

describe('mergeLiveCurrentMatchStatsIntoNextState', () => {
  it('объединяет отметки с двух клиентов по одному игроку (max по полям)', () => {
    const prev = {
      standingsSnapshot: {
        currentHomeTeam: 'Ясность',
        currentAwayTeam: 'РФОИ',
        currentHomeStats: {
          5: { goals: 0, assists: 0, saves: 0, yellows: 1 },
        },
        currentAwayStats: {},
      },
    } as Record<string, unknown>

    const next = {
      standingsSnapshot: {
        currentHomeTeam: 'Ясность',
        currentAwayTeam: 'РФОИ',
        currentHomeStats: {
          5: { goals: 0, assists: 1, saves: 0, yellows: 0 },
        },
        currentAwayStats: {},
      },
    } as Record<string, unknown>

    mergeLiveCurrentMatchStatsIntoNextState(prev, next)

    const snap = next.standingsSnapshot as Record<string, unknown>
    const home = snap.currentHomeStats as Record<string, { yellows: number; assists: number }>
    expect(home[5].yellows).toBe(1)
    expect(home[5].assists).toBe(1)
  })

  it('не мержит если пара команд другая', () => {
    const prev = {
      standingsSnapshot: {
        currentHomeTeam: 'A',
        currentAwayTeam: 'B',
        currentHomeStats: { 1: { goals: 0, assists: 0, saves: 0, yellows: 1 } },
        currentAwayStats: {},
      },
    } as Record<string, unknown>

    const next = {
      standingsSnapshot: {
        currentHomeTeam: 'C',
        currentAwayTeam: 'D',
        currentHomeStats: { 1: { goals: 0, assists: 1, saves: 0, yellows: 0 } },
        currentAwayStats: {},
      },
    } as Record<string, unknown>

    mergeLiveCurrentMatchStatsIntoNextState(prev, next)

    const snap = next.standingsSnapshot as Record<string, unknown>
    const home = snap.currentHomeStats as Record<string, { yellows: number; assists: number }>
    expect(home[1].yellows).toBe(0)
    expect(home[1].assists).toBe(1)
  })
})
