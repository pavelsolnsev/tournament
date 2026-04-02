// Тесты для логики выбора MVP турнира.
// Важно: MVP получает бонус к рейтингу — ошибка в selectMvp влияет на все итоги турнира.
import { describe, it, expect } from 'vitest'
import { selectMvp } from '~/composables/tournament-standings/mvp'
import type { MvpCandidate, MvpTeamStat } from '~/composables/tournament-standings/mvp'

// Базовый кандидат с нулевой статистикой.
function makeCandidate(id: number, overrides: Partial<MvpCandidate> = {}): MvpCandidate {
  return {
    id,
    goals: 0,
    assists: 0,
    saves: 0,
    wins: 0,
    yellows: 0,
    ratingDelta: 0,
    baseRating: 0,
    ...overrides,
  }
}

describe('selectMvp', () => {
  it('возвращает null для пустого списка', () => {
    expect(selectMvp([])).toBeNull()
  })

  it('возвращает единственного кандидата', () => {
    const c = makeCandidate(1, { goals: 2 })
    expect(selectMvp([c])?.id).toBe(1)
  })

  it('выбирает игрока с большим количеством голов', () => {
    const a = makeCandidate(1, { goals: 3 })
    const b = makeCandidate(2, { goals: 5 })
    expect(selectMvp([a, b])?.id).toBe(2)
  })

  it('при равных голах — больше ассистов', () => {
    const a = makeCandidate(1, { goals: 2, assists: 1 })
    const b = makeCandidate(2, { goals: 2, assists: 3 })
    expect(selectMvp([a, b])?.id).toBe(2)
  })

  it('при равных голах и ассистах — больше сейвов', () => {
    const a = makeCandidate(1, { goals: 1, assists: 1, saves: 5 })
    const b = makeCandidate(2, { goals: 1, assists: 1, saves: 2 })
    expect(selectMvp([a, b])?.id).toBe(1)
  })

  it('жёлтые карточки снижают приоритет при равных метках', () => {
    const a = makeCandidate(1, { goals: 2, yellows: 0 })
    const b = makeCandidate(2, { goals: 2, yellows: 2 })
    expect(selectMvp([a, b])?.id).toBe(1)
  })

  it('при полном равенстве — выбирает меньший id (детерминированность)', () => {
    const a = makeCandidate(3)
    const b = makeCandidate(1)
    const c = makeCandidate(2)
    expect(selectMvp([a, b, c])?.id).toBe(1)
  })

  it('учитывает очки команды при передаче teamStats', () => {
    const a = makeCandidate(1, { goals: 2 })
    const b = makeCandidate(2, { goals: 2 })
    const assignment: Record<number, string> = { 1: 'Красные', 2: 'Синие' }
    const teamStats: MvpTeamStat[] = [
      { teamName: 'Красные', wins: 1, draws: 0, goalsFor: 3, goalsAgainst: 1 },
      { teamName: 'Синие', wins: 3, draws: 0, goalsFor: 9, goalsAgainst: 2 },
    ]
    // Синие набрали 9 очков против 3 у Красных — игрок из Синих становится MVP.
    expect(selectMvp([a, b], { assignmentByPlayerId: assignment, teamStats })?.id).toBe(2)
  })

  it('выше ratingDelta при равных голах/ассистах/сейвах', () => {
    const a = makeCandidate(1, { goals: 1, ratingDelta: 0.5 })
    const b = makeCandidate(2, { goals: 1, ratingDelta: 2.0 })
    expect(selectMvp([a, b])?.id).toBe(2)
  })

  it('больше побед при равной статистике', () => {
    const a = makeCandidate(1, { wins: 5 })
    const b = makeCandidate(2, { wins: 2 })
    expect(selectMvp([a, b])?.id).toBe(1)
  })
})
