import { describe, it, expect } from 'vitest'
import { pruneAssignmentToSelected, removePlayerFromTournamentState } from '../server/utils/tournamentPlayerRemoval'

function state() {
  return {
    selectedIds: [1, 2, 3],
    assignmentByPlayerId: { 1: 'Ручеёк', 2: 'Ручеёк', 3: 'АСБИ' },
    vkTeamLabelByPlayerId: { 2: 'Ручеёк' },
    paidPlayerIds: [2, 3],
  } as Record<string, unknown>
}

describe('removePlayerFromTournamentState', () => {
  it('вышел — убран из участников, состава команды, подписи ВК и оплаты', () => {
    const s = state()

    expect(removePlayerFromTournamentState(s, 2)).toBe(true)

    expect(s.selectedIds).toEqual([1, 3])
    expect(s.assignmentByPlayerId).toEqual({ 1: 'Ручеёк', 3: 'АСБИ' })
    expect(s.vkTeamLabelByPlayerId).toBeUndefined()
    expect(s.paidPlayerIds).toEqual([3])
  })

  it('игрока не было в турнире — ничего не меняется', () => {
    const s = state()

    expect(removePlayerFromTournamentState(s, 99)).toBe(false)

    expect(s.selectedIds).toEqual([1, 2, 3])
    expect(s.assignmentByPlayerId).toEqual({ 1: 'Ручеёк', 2: 'Ручеёк', 3: 'АСБИ' })
  })
})

describe('pruneAssignmentToSelected', () => {
  it('из состава убирается тот, кого уже нет среди участников (отставшая вкладка)', () => {
    const s = { ...state(), selectedIds: [1, 3] }

    pruneAssignmentToSelected(s)

    expect(s.assignmentByPlayerId).toEqual({ 1: 'Ручеёк', 3: 'АСБИ' })
  })

  it('нет расстановки — ничего не ломается', () => {
    const s = { selectedIds: [1] } as Record<string, unknown>
    pruneAssignmentToSelected(s)
    expect(s.assignmentByPlayerId).toBeUndefined()
  })
})
