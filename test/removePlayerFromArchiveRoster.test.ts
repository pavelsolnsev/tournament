import { describe, it, expect } from 'vitest'
import {
  parseArchiveRoster,
  removePlayerFromArchiveRoster,
} from '../server/utils/removePlayerFromArchiveRoster'

/** Небольшой состав турнира: два игрока в одной команде, третий — в другой. */
function samplePlayers() {
  return [
    { id: 1, name: 'Игрок 1', username: null, photo: null, rating: 50 },
    { id: 2, name: 'Игрок 2', username: null, photo: null, rating: 60 },
    { id: 3, name: 'Игрок 3', username: null, photo: null, rating: 70 },
  ]
}

function sampleAssignment() {
  return { '1': 'Красные', '2': 'Красные', '3': 'Синие' }
}

describe('parseArchiveRoster', () => {
  it('разбирает players и teams из строк JSON (как приходят из БД)', () => {
    const { players, assignmentByPlayerId } = parseArchiveRoster(
      JSON.stringify(samplePlayers()),
      JSON.stringify(sampleAssignment()),
    )
    expect(players).toHaveLength(3)
    expect(assignmentByPlayerId).toEqual(sampleAssignment())
  })

  it('принимает уже распарсенные значения (объект/массив)', () => {
    const { players, assignmentByPlayerId } = parseArchiveRoster(samplePlayers(), sampleAssignment())
    expect(players).toHaveLength(3)
    expect(assignmentByPlayerId['1']).toBe('Красные')
  })

  it('битый JSON не роняет запрос — отдаёт пустые players/assignment', () => {
    const { players, assignmentByPlayerId } = parseArchiveRoster('{не json', '{тоже не json')
    expect(players).toEqual([])
    expect(assignmentByPlayerId).toEqual({})
  })

  it('players не массив или teams не объект — тоже безопасный пустой результат', () => {
    const { players, assignmentByPlayerId } = parseArchiveRoster(
      JSON.stringify({ not: 'array' }),
      JSON.stringify(['not', 'object']),
    )
    expect(players).toEqual([])
    expect(assignmentByPlayerId).toEqual({})
  })
})

describe('removePlayerFromArchiveRoster', () => {
  it('убирает игрока из players и его запись из assignmentByPlayerId', () => {
    const result = removePlayerFromArchiveRoster(samplePlayers(), sampleAssignment(), 2)

    expect(result.players.map((p) => p.id)).toEqual([1, 3])
    expect(result.assignmentByPlayerId).toEqual({ '1': 'Красные', '3': 'Синие' })
  })

  it('остальных игроков и их команды не трогает', () => {
    const result = removePlayerFromArchiveRoster(samplePlayers(), sampleAssignment(), 3)

    expect(result.players.map((p) => p.id)).toEqual([1, 2])
    expect(result.assignmentByPlayerId).toEqual({ '1': 'Красные', '2': 'Красные' })
  })

  it('несуществующий id — состав и назначения остаются как есть', () => {
    const result = removePlayerFromArchiveRoster(samplePlayers(), sampleAssignment(), 999)

    expect(result.players).toHaveLength(3)
    expect(result.assignmentByPlayerId).toEqual(sampleAssignment())
  })

  it('не мутирует исходные players и assignmentByPlayerId', () => {
    const players = samplePlayers()
    const assignment = sampleAssignment()

    removePlayerFromArchiveRoster(players, assignment, 1)

    expect(players).toHaveLength(3)
    expect(assignment).toEqual(sampleAssignment())
  })

  it('игрок без записи в assignmentByPlayerId — просто уходит из players', () => {
    const result = removePlayerFromArchiveRoster(samplePlayers(), { '1': 'Красные' }, 2)

    expect(result.players.map((p) => p.id)).toEqual([1, 3])
    expect(result.assignmentByPlayerId).toEqual({ '1': 'Красные' })
  })
})
