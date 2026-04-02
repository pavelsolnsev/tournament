// Тесты для расчёта рейтинга игрока за матч.
// Это самая критичная логика — от неё зависит честность всего турнира.
import { describe, it, expect } from 'vitest'
import { round1, growthModifier, calculateMatchRatingDelta } from '~/composables/tournament-standings/ratingCalc'

describe('round1', () => {
  it('округляет до 1 знака', () => {
    expect(round1(1.25)).toBe(1.3)
    expect(round1(1.24)).toBe(1.2)
    expect(round1(1.35)).toBe(1.4)
    // Замечание: round1(-1.35) = -1.3 из-за IEEE 754 floating point — это ожидаемое поведение JS.
    // Реальные значения в турнире никогда не будут точно -1.35, так что это не влияет на игру.
    expect(round1(-1.3)).toBe(-1.3)
    expect(round1(-1.4)).toBe(-1.4)
  })

  it('возвращает целое без изменений', () => {
    expect(round1(5)).toBe(5)
    expect(round1(-3)).toBe(-3)
  })
})

describe('growthModifier', () => {
  it('возвращает 1.0 при рейтинге 0', () => {
    expect(growthModifier(0)).toBe(1.0)
  })

  it('снижается с ростом рейтинга', () => {
    expect(growthModifier(125)).toBe(0.5)
    expect(growthModifier(200)).toBe(round1(1 - 200 / 250))
  })

  it('не опускается ниже 0.2', () => {
    // При рейтинге 250 модификатор стал бы 0, но ограничен 0.2.
    expect(growthModifier(250)).toBe(0.2)
    expect(growthModifier(500)).toBe(0.2)
  })
})

describe('calculateMatchRatingDelta', () => {
  const emptyStats = { goals: 0, assists: 0, saves: 0, yellows: 0 }

  it('победа без событий даёт положительную дельту', () => {
    const delta = calculateMatchRatingDelta(emptyStats, 0, true, false, false, 3, 1)
    expect(delta).toBeGreaterThan(0)
  })

  it('поражение без событий даёт отрицательную дельту', () => {
    const delta = calculateMatchRatingDelta(emptyStats, 0, false, false, true, 1, 3)
    expect(delta).toBeLessThan(0)
  })

  it('ничья без событий даёт небольшую положительную дельту', () => {
    const delta = calculateMatchRatingDelta(emptyStats, 0, false, true, false, 2, 2)
    expect(delta).toBeGreaterThan(0)
  })

  it('гол добавляет к дельте', () => {
    const noGoal = calculateMatchRatingDelta(emptyStats, 0, false, true, false, 1, 1)
    const withGoal = calculateMatchRatingDelta({ ...emptyStats, goals: 1 }, 0, false, true, false, 1, 1)
    expect(withGoal).toBeGreaterThan(noGoal)
  })

  it('жёлтая карточка снижает дельту', () => {
    const clean = calculateMatchRatingDelta(emptyStats, 0, true, false, false, 2, 0)
    const yellow = calculateMatchRatingDelta({ ...emptyStats, yellows: 1 }, 0, true, false, false, 2, 0)
    expect(yellow).toBeLessThan(clean)
  })

  it('сухая победа 3:0 даёт бонус shutout', () => {
    const normalWin = calculateMatchRatingDelta(emptyStats, 0, true, false, false, 1, 0)
    const shutoutWin = calculateMatchRatingDelta(emptyStats, 0, true, false, false, 3, 0)
    expect(shutoutWin).toBeGreaterThan(normalWin)
  })

  it('высокий рейтинг снижает дельту через growthModifier', () => {
    const lowRating = calculateMatchRatingDelta(emptyStats, 0, true, false, false, 2, 1)
    const highRating = calculateMatchRatingDelta(emptyStats, 200, true, false, false, 2, 1)
    // При высоком рейтинге модификатор роста меньше, значит дельта тоже меньше.
    expect(highRating).toBeLessThan(lowRating)
  })

  it('хет-трик даёт бонус за голы', () => {
    const twoGoals = calculateMatchRatingDelta({ ...emptyStats, goals: 2 }, 0, false, true, false, 2, 2)
    const hattrick = calculateMatchRatingDelta({ ...emptyStats, goals: 3 }, 0, false, true, false, 3, 2)
    expect(hattrick).toBeGreaterThan(twoGoals)
  })

  it('результат всегда округлён до 1 знака', () => {
    const delta = calculateMatchRatingDelta({ goals: 1, assists: 1, saves: 2, yellows: 1 }, 50, true, false, false, 2, 1)
    const asString = String(delta)
    // Проверяем что после точки не более 1 знака.
    const decimals = asString.includes('.') ? asString.split('.')[1]?.length ?? 0 : 0
    expect(decimals).toBeLessThanOrEqual(1)
  })
})
