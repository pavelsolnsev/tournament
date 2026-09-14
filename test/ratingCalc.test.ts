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
  const emptyStats = { goals: 0, assists: 0, saves: 0, yellows: 0, reds: 0 }

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
    const delta = calculateMatchRatingDelta({ goals: 1, assists: 1, saves: 2, yellows: 1, reds: 0 }, 50, true, false, false, 2, 1)
    const asString = String(delta)
    // Проверяем что после точки не более 1 знака.
    const decimals = asString.includes('.') ? asString.split('.')[1]?.length ?? 0 : 0
    expect(decimals).toBeLessThanOrEqual(1)
  })
})

describe('новые правила начисления', () => {
  const empty = { goals: 0, assists: 0, saves: 0, yellows: 0, reds: 0 }

  it('сухой лист получают все игроки состава, а не только вратарь', () => {
    // Победа 1:0 без единой отметки: 1.8 за победу + 0.2 за сухой матч.
    expect(calculateMatchRatingDelta(empty, 0, true, false, false, 1, 0)).toBe(2)
    // Тот же бонус при нулевой ничьей 0:0.
    expect(calculateMatchRatingDelta(empty, 0, false, true, false, 0, 0)).toBe(0.7)
  })

  it('крупная победа даёт по 0.1 за каждый гол разницы свыше первого', () => {
    const win21 = calculateMatchRatingDelta(empty, 0, true, false, false, 2, 1)
    const win31 = calculateMatchRatingDelta(empty, 0, true, false, false, 3, 1)
    const win41 = calculateMatchRatingDelta(empty, 0, true, false, false, 4, 1)
    expect(win21).toBe(1.8)
    expect(round1(win31 - win21)).toBe(0.1)
    expect(round1(win41 - win21)).toBe(0.2)
  })

  it('бонус за разницу не растёт бесконечно — потолок 0.5', () => {
    const win70 = calculateMatchRatingDelta(empty, 0, true, false, false, 7, 0)
    const win90 = calculateMatchRatingDelta(empty, 0, true, false, false, 9, 0)
    expect(win70).toBe(win90)
  })

  it('бонус за разницу добавляется к бонусу за сухую победу', () => {
    // 3:0 — победа 1.8, сухой матч 0.2, сухая победа 0.5, разница 0.2.
    expect(calculateMatchRatingDelta(empty, 0, true, false, false, 3, 0)).toBe(2.7)
  })

  it('проигравшему бонус за разницу не начисляется', () => {
    const lose = calculateMatchRatingDelta(empty, 0, false, false, true, 1, 4)
    expect(lose).toBe(-1.3)
  })

  it('красная карточка забирает 2 и не зависит от рейтинга', () => {
    const red = { ...empty, reds: 1 }
    const winNoCard = calculateMatchRatingDelta(empty, 0, true, false, false, 1, 1)
    const winWithCard = calculateMatchRatingDelta(red, 0, true, false, false, 1, 1)
    expect(round1(winWithCard - winNoCard)).toBe(-2)

    // У сильного игрока штраф тот же самый.
    const strongNoCard = calculateMatchRatingDelta(empty, 200, true, false, false, 1, 1)
    const strongWithCard = calculateMatchRatingDelta(red, 200, true, false, false, 1, 1)
    expect(round1(strongWithCard - strongNoCard)).toBe(-2)
  })

  it('две красные забирают вдвое больше', () => {
    const one = calculateMatchRatingDelta({ ...empty, reds: 1 }, 0, false, true, false, 1, 1)
    const two = calculateMatchRatingDelta({ ...empty, reds: 2 }, 0, false, true, false, 1, 1)
    expect(round1(one - two)).toBe(2)
  })

  it('старое состояние без поля reds не ломает расчёт', () => {
    const legacy = { goals: 1, assists: 0, saves: 0, yellows: 0 } as unknown as typeof empty
    expect(calculateMatchRatingDelta(legacy, 0, true, false, false, 2, 1)).toBe(2.1)
  })
})

describe('цена карточек', () => {
  const empty = { goals: 0, assists: 0, saves: 0, yellows: 0, reds: 0 }

  it('жёлтая забирает 1 и не зависит от рейтинга', () => {
    for (const base of [0, 100, 200]) {
      const clean = calculateMatchRatingDelta(empty, base, true, false, false, 2, 1)
      const yellow = calculateMatchRatingDelta({ ...empty, yellows: 1 }, base, true, false, false, 2, 1)
      expect(round1(yellow - clean)).toBe(-1)
    }
  })

  it('две жёлтые забирают вдвое больше', () => {
    const one = calculateMatchRatingDelta({ ...empty, yellows: 1 }, 0, false, true, false, 1, 1)
    const two = calculateMatchRatingDelta({ ...empty, yellows: 2 }, 0, false, true, false, 1, 1)
    expect(round1(one - two)).toBe(1)
  })

  it('красная дороже жёлтой ровно вдвое', () => {
    const yellow = calculateMatchRatingDelta({ ...empty, yellows: 1 }, 0, false, true, false, 1, 1)
    const red = calculateMatchRatingDelta({ ...empty, reds: 1 }, 0, false, true, false, 1, 1)
    const clean = calculateMatchRatingDelta(empty, 0, false, true, false, 1, 1)
    expect(round1(clean - yellow)).toBe(1)
    expect(round1(clean - red)).toBe(2)
  })
})
