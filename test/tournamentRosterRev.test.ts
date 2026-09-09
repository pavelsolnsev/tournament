import { describe, it, expect } from 'vitest'
import {
  bumpRosterRev,
  mergeRosterIntoNextState,
  rosterRevOf,
} from '../server/utils/tournamentRosterRev'

/** Состояние в БД: админ уже добавил игрока 3 и поставил его в «Красные». */
function prevState() {
  return {
    rosterRev: 4,
    selectedIds: [1, 2, 3],
    assignmentByPlayerId: { 1: 'Красные', 2: 'Синие', 3: 'Красные' },
    confirmedTeamNames: ['Красные', 'Синие'],
    teamColors: { красные: 0, синие: 1 },
    vkTeamLabelByPlayerId: { 3: 'Красные' },
    vkTeamSlots: ['Красные', 'Синие'],
  } as Record<string, unknown>
}

/** Тело PUT от судьи: состав он не правил, версия у него старая. */
function judgePut(overrides: Record<string, unknown> = {}) {
  return {
    rosterRev: 3,
    selectedIds: [1, 2],
    assignmentByPlayerId: { 1: 'Красные', 2: 'Синие' },
    confirmedTeamNames: ['Красные', 'Синие'],
    teamColors: { красные: 0, синие: 1 },
    vkTeamLabelByPlayerId: {},
    vkTeamSlots: ['Красные', 'Синие'],
    ...overrides,
  } as Record<string, unknown>
}

describe('rosterRevOf / bumpRosterRev', () => {
  it('нет версии — считаем нулём', () => {
    expect(rosterRevOf({})).toBe(0)
    expect(rosterRevOf(null)).toBe(0)
  })

  it('bump двигает версию вперёд', () => {
    const state: Record<string, unknown> = { rosterRev: 7 }
    bumpRosterRev(state)
    expect(state.rosterRev).toBe(8)
  })

  it('bump на состоянии без версии начинает с единицы', () => {
    const state: Record<string, unknown> = {}
    bumpRosterRev(state)
    expect(state.rosterRev).toBe(1)
  })
})

describe('mergeRosterIntoNextState', () => {
  it('отметка судьи со старой версией не откатывает добавленного игрока', () => {
    const next = judgePut()

    mergeRosterIntoNextState(prevState(), next)

    expect(next.selectedIds).toEqual([1, 2, 3])
    expect(next.assignmentByPlayerId).toEqual({ 1: 'Красные', 2: 'Синие', 3: 'Красные' })
    expect(next.vkTeamLabelByPlayerId).toEqual({ 3: 'Красные' })
    expect(next.rosterRev).toBe(4)
  })

  it('равная версия тоже не даёт менять состав — правку заявляют версией больше', () => {
    const next = judgePut({ rosterRev: 4 })

    mergeRosterIntoNextState(prevState(), next)

    expect(next.selectedIds).toEqual([1, 2, 3])
  })

  it('админ заявил новую версию — его состав принимается целиком', () => {
    const next = judgePut({ rosterRev: 5, selectedIds: [1, 3], assignmentByPlayerId: { 3: 'Синие' } })

    mergeRosterIntoNextState(prevState(), next)

    expect(next.selectedIds).toEqual([1, 3])
    expect(next.assignmentByPlayerId).toEqual({ 3: 'Синие' })
    expect(next.rosterRev).toBe(5)
  })

  it('чего не было в БД, того не появится из устаревшего тела', () => {
    const prev = { rosterRev: 2, selectedIds: [1] } as Record<string, unknown>
    const next = judgePut({ rosterRev: 1 })

    mergeRosterIntoNextState(prev, next)

    expect(next.selectedIds).toEqual([1])
    expect(next.assignmentByPlayerId).toBeUndefined()
    expect(next.confirmedTeamNames).toBeUndefined()
  })

  it('состав команд и цвета тоже защищены', () => {
    const prev = prevState()
    prev.confirmedTeamNames = ['Красные', 'Синие', 'Жёлтые']
    const next = judgePut()

    mergeRosterIntoNextState(prev, next)

    expect(next.confirmedTeamNames).toEqual(['Красные', 'Синие', 'Жёлтые'])
  })
})
