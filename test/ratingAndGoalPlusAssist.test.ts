import { describe, it, expect } from 'vitest'
import type { Player } from '../app/types/tournament'
import type { PlayerMatchStats } from '../app/composables/tournament-standings/types'
import {
  buildRatingChanges,
  findTopGoalPlusAssist,
  makeRowFactory,
} from '../app/composables/tournament-summary/ratingAndGoalPlusAssist'

const players = [1, 2, 3, 4, 5].map((id) => ({ id, name: `Игрок ${id}`, username: null, photo: null, rating: 50 })) as Player[]
const assignment: Record<number, string> = { 1: 'Красные', 2: 'Красные', 3: 'Синие', 4: 'Синие' } // 5 — не в составе
const stats = (g: number, a: number) => ({ goals: g, assists: a, saves: 0, yellows: 0, reds: 0 }) as PlayerMatchStats
const toRow = makeRowFactory(assignment, {}, () => '🔴')

describe('findTopGoalPlusAssist', () => {
  it('лидер по сумме голов и передач, а не по голам', () => {
    const agg = { 1: stats(4, 0), 2: stats(2, 3), 3: stats(0, 1) }
    const top = findTopGoalPlusAssist(players, agg, toRow)
    expect(top.map((w) => w.playerId)).toEqual([2])
    expect(top[0]!.value).toBe(5)
  })

  it('при равной сумме показывает всех лидеров', () => {
    const agg = { 1: stats(3, 0), 2: stats(1, 2) }
    expect(findTopGoalPlusAssist(players, agg, toRow).map((w) => w.playerId)).toEqual([1, 2])
  })

  it('никто не забил и не отдал — пусто', () => {
    expect(findTopGoalPlusAssist(players, {}, toRow)).toEqual([])
  })
})

describe('buildRatingChanges', () => {
  it('полный итог с бонусами важнее изменения за матчи', () => {
    const r = buildRatingChanges(players, assignment, { 1: 1 }, { 1: 3.04, 3: -1 }, toRow)
    expect(r.withTournamentBonus).toBe(true)
    expect(r.up.map((x) => [x.playerId, x.value])).toEqual([[1, 3]])
    expect(r.down.map((x) => [x.playerId, x.value])).toEqual([[3, -1]])
  })

  it('старый архив без итога — берём изменение за матчи', () => {
    const r = buildRatingChanges(players, assignment, { 2: 2.5, 4: -0.5 }, undefined, toRow)
    expect(r.withTournamentBonus).toBe(false)
    expect(r.up.map((x) => x.playerId)).toEqual([2])
    expect(r.down.map((x) => x.playerId)).toEqual([4])
  })

  it('сортирует, берёт по трое и не учитывает тех, кого нет в составе', () => {
    const deltas = { 1: 1, 2: 4, 3: 2, 4: 3, 5: 10 }
    const r = buildRatingChanges(players, assignment, deltas, undefined, toRow)
    expect(r.up.map((x) => x.playerId)).toEqual([2, 4, 3])
    expect(r.down).toEqual([])
  })
})
