import { describe, it, expect } from 'vitest'
import { forecastSchedule } from '../app/composables/tournament-standings/schedule'

const teams = ['РФОИ', 'АСБИ', 'Ручеёк', 'Ясность']

describe('forecastSchedule', () => {
  it('4 команды без сыгранных матчей — 18 матчей, у каждой команды по 9', () => {
    const s = forecastSchedule({ teams, played: [], current: null })
    expect(s).toHaveLength(18)
    expect(s.map((m) => m.number)).toEqual(Array.from({ length: 18 }, (_, i) => i + 1))
    const games: Record<string, number> = {}
    for (const m of s) {
      games[m.home] = (games[m.home] ?? 0) + 1
      games[m.away] = (games[m.away] ?? 0) + 1
      expect(m.home).not.toBe(m.away)
    }
    expect(Object.values(games)).toEqual([9, 9, 9, 9])
  })

  it('идёт матч — он первый в списке и помечен, дальше остаток плана', () => {
    const played = [{ homeTeam: 'РФОИ', awayTeam: 'АСБИ', matchNumber: 1 }]
    const s = forecastSchedule({ teams, played, current: { home: 'Ручеёк', away: 'Ясность' } })
    expect(s[0]).toEqual({ number: 2, home: 'Ручеёк', away: 'Ясность', isCurrent: true })
    expect(s).toHaveLength(17)
    expect(s.slice(1).every((m) => !m.isCurrent)).toBe(true)
  })

  it('следующая пара совпадает с тем, что выберет «Следующий матч»', () => {
    const played = [
      { homeTeam: 'РФОИ', awayTeam: 'АСБИ', matchNumber: 1 },
      { homeTeam: 'Ручеёк', awayTeam: 'Ясность', matchNumber: 2 },
    ]
    const full = forecastSchedule({ teams, played, current: null })
    const afterOne = forecastSchedule({ teams, played: [...played, { homeTeam: full[0]!.home, awayTeam: full[0]!.away, matchNumber: 3 }], current: null })
    // Прогноз устойчив: сыграли предсказанный матч — дальше тот же порядок.
    expect(afterOne.map((m) => [m.home, m.away])).toEqual(full.slice(1).map((m) => [m.home, m.away]))
  })

  it('план выполнен — расписание пустое; меньше двух команд — тоже', () => {
    const played = Array.from({ length: 12 }, (_, i) => ({ homeTeam: 'A', awayTeam: 'B', matchNumber: i + 1 }))
    expect(forecastSchedule({ teams: ['A', 'B', 'C'], played, current: null })).toEqual([])
    expect(forecastSchedule({ teams: ['A'], played: [], current: null })).toEqual([])
  })

  it('дома и в гостях — поровну: при 3 командах по 4 + 4, при 4 командах 4–5 из 9', () => {
    const count = (list: { home: string; away: string }[]) => {
      const home: Record<string, number> = {}
      const away: Record<string, number> = {}
      for (const m of list) {
        home[m.home] = (home[m.home] ?? 0) + 1
        away[m.away] = (away[m.away] ?? 0) + 1
      }
      return { home, away }
    }
    const three = count(forecastSchedule({ teams: ['A', 'B', 'C'], played: [], current: null }))
    for (const t of ['A', 'B', 'C']) {
      expect(three.home[t]).toBe(4)
      expect(three.away[t]).toBe(4)
    }
    const four = count(forecastSchedule({ teams, played: [], current: null }))
    for (const t of teams) {
      expect(Math.abs((four.home[t] ?? 0) - (four.away[t] ?? 0))).toBeLessThanOrEqual(1)
    }
  })
})
