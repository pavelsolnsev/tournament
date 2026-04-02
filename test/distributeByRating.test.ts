// Тесты для алгоритма распределения игроков по командам.
// Корректное распределение — залог честного турнира: команды должны быть сбалансированы.
import { describe, it, expect } from 'vitest'
import { distributePlayersByRating } from '~/utils/distributeByRating'
import type { Player } from '~/types/tournament'

// Создаём тестового игрока с заданным рейтингом.
function makePlayer(id: number, rating: number): Player {
  return { id, name: `Player ${id}`, username: null, rating }
}

describe('distributePlayersByRating', () => {
  it('создаёт ровно teamCount команд', () => {
    const players = [1, 2, 3, 4, 5, 6].map((id) => makePlayer(id, id * 10))
    const result = distributePlayersByRating(players, 3)
    expect(Object.keys(result.teamAssignments)).toHaveLength(3)
  })

  it('назначает всех игроков (никто не потерян)', () => {
    const players = [1, 2, 3, 4, 5, 6].map((id) => makePlayer(id, id * 10))
    const result = distributePlayersByRating(players, 2)
    const allAssigned = Object.values(result.teamAssignments).flat()
    expect(allAssigned).toHaveLength(players.length)
    // Проверяем уникальность — никто не назначен дважды.
    expect(new Set(allAssigned).size).toBe(players.length)
  })

  it('ограничивает количество команд: не меньше 2', () => {
    const players = [1, 2].map((id) => makePlayer(id, id * 10))
    const result = distributePlayersByRating(players, 1)
    expect(Object.keys(result.teamAssignments)).toHaveLength(2)
  })

  it('ограничивает количество команд: не больше 4', () => {
    const players = Array.from({ length: 10 }, (_, i) => makePlayer(i + 1, (i + 1) * 5))
    const result = distributePlayersByRating(players, 10)
    expect(Object.keys(result.teamAssignments)).toHaveLength(4)
  })

  it('разница в числе игроков между командами не превышает 1', () => {
    // 7 игроков, 3 команды: 3+2+2 — разница ровно 1.
    const players = Array.from({ length: 7 }, (_, i) => makePlayer(i + 1, (i + 1) * 10))
    const result = distributePlayersByRating(players, 3)
    const sizes = Object.values(result.teamAssignments).map((ids) => ids.length)
    const maxSize = Math.max(...sizes)
    const minSize = Math.min(...sizes)
    expect(maxSize - minSize).toBeLessThanOrEqual(1)
  })

  it('команды Команда 1, Команда 2, ... правильно именуются', () => {
    const players = [1, 2, 3, 4].map((id) => makePlayer(id, id * 10))
    const result = distributePlayersByRating(players, 2)
    expect(result.teamAssignments['Команда 1']).toBeDefined()
    expect(result.teamAssignments['Команда 2']).toBeDefined()
  })

  it('игрок с наивысшим рейтингом попадает в Команда 1', () => {
    // В методе snake draft: игрок #1 (наибольший рейтинг) → Команда 1.
    const players = [
      makePlayer(1, 100),
      makePlayer(2, 80),
      makePlayer(3, 60),
      makePlayer(4, 40),
    ]
    const result = distributePlayersByRating(players, 2)
    // Лучший игрок (id=1, рейтинг 100) должен попасть в Команда 1.
    expect(result.teamAssignments['Команда 1']).toContain(1)
  })

  it('суммарные рейтинги команд близки (разница <= среднего рейтинга одного игрока)', () => {
    const players = [100, 90, 80, 70, 60, 50].map((r, i) => makePlayer(i + 1, r))
    const result = distributePlayersByRating(players, 2)
    const ratings = Object.values(result.teamRatings)
    const diff = Math.abs(ratings[0]! - ratings[1]!)
    // При 6 игроках с рейтингами 100-50 snake должен дать очень близкие суммы.
    expect(diff).toBeLessThanOrEqual(30)
  })

  it('работает с пустым списком игроков', () => {
    const result = distributePlayersByRating([], 2)
    const allAssigned = Object.values(result.teamAssignments).flat()
    expect(allAssigned).toHaveLength(0)
  })

  it('работает когда у всех игроков рейтинг 0', () => {
    const players = [1, 2, 3, 4].map((id) => makePlayer(id, 0))
    const result = distributePlayersByRating(players, 2)
    const allAssigned = Object.values(result.teamAssignments).flat()
    expect(allAssigned).toHaveLength(4)
  })
})
