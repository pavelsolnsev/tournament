import { describe, it, expect } from 'vitest'
import {
  effectivePlayerStats,
  effectiveStatsRecord,
} from '../app/composables/tournament-standings/liveMatchStats'

function s(goals: number, assists = 0, saves = 0, yellows = 0) {
  return { goals, assists, saves, yellows }
}

describe('effectivePlayerStats', () => {
  it('вычитает снятое из добавленного', () => {
    expect(effectivePlayerStats({ 5: s(2, 1) }, { 5: s(1) }, 5)).toEqual(s(1, 1))
  })

  it('не уходит ниже нуля, если снятий больше', () => {
    expect(effectivePlayerStats({ 5: s(1) }, { 5: s(3) }, 5)).toEqual(s(0))
  })

  it('игрока без отметок отдаёт нулями', () => {
    expect(effectivePlayerStats({}, {}, 42)).toEqual(s(0))
  })
})

describe('effectiveStatsRecord', () => {
  it('считает итог по всем игрокам матча', () => {
    const out = effectiveStatsRecord({ 5: s(2), 7: s(1) }, { 5: s(1) })
    expect(out).toEqual({ 5: s(1), 7: s(1) })
  })

  it('игроки без событий остаются в списке — это состав матча для дельт рейтинга', () => {
    const out = effectiveStatsRecord({ 5: s(1), 9: s(0) }, { 5: s(1) })
    expect(Object.keys(out).sort()).toEqual(['5', '9'])
    expect(out[5]).toEqual(s(0))
  })
})
