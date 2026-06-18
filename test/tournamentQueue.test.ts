// Тесты расчёта очереди на сайте — должны совпадать со split в боте.
import { describe, it, expect } from 'vitest'
import { computeQueuedPlayerIds } from '~/utils/tournamentQueue'

describe('computeQueuedPlayerIds', () => {
  it('переполнение команды по лимиту уходит в очередь', () => {
    const q = computeQueuedPlayerIds({
      orderedIds: [1, 2, 3],
      teamLabelByPlayerId: { 1: 'A', 2: 'A', 3: 'B' },
      teamSlots: ['A', 'B'],
      teamLimits: { a: 1 },
      listLimit: null,
    })
    expect([...q]).toEqual([2])
  })

  it('«без команды» всегда в основе, очереди нет', () => {
    const q = computeQueuedPlayerIds({
      orderedIds: [1, 2],
      teamLabelByPlayerId: {},
      teamSlots: ['A'],
      teamLimits: {},
      listLimit: null,
    })
    expect(q.size).toBe(0)
  })

  it('общий лимит списка: лишние в очередь', () => {
    const q = computeQueuedPlayerIds({
      orderedIds: [1, 2, 3],
      teamLabelByPlayerId: {},
      teamSlots: [],
      teamLimits: {},
      listLimit: 2,
    })
    expect([...q]).toEqual([3])
  })

  it('без лимитов и команд — очереди нет', () => {
    const q = computeQueuedPlayerIds({
      orderedIds: [1, 2, 3],
      teamLabelByPlayerId: {},
      teamSlots: [],
      teamLimits: {},
      listLimit: null,
    })
    expect(q.size).toBe(0)
  })
})
