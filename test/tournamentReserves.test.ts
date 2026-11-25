import { describe, expect, it } from 'vitest'
import { computeQueuedPlayerIds } from '../app/utils/tournamentQueue'
import { changeTournamentReserve } from '../server/utils/changeTournamentReserve'

const upcoming = { step: 0, matchStatus: 'upcoming', vkListLimit: 4, selectedIds: [1, 2] }

describe('tournament reserves', () => {
  it('holds seats and assigns a reserved player ahead of the existing queue', () => {
    const reserved = changeTournamentReserve(upcoming, { action: 'add', seats: 2, team: '', note: 'Гости' }, 'reserve')
    const state = { ...reserved, selectedIds: [1, 2, 3, 4] }
    const queue = (ids: number[], reserves: typeof reserved.vkReserves) => [...computeQueuedPlayerIds({
      orderedIds: ids, reserves, listLimit: 4, teamLabelByPlayerId: {}, teamSlots: [], teamLimits: {},
    })]
    expect(queue(state.selectedIds, reserved.vkReserves)).toEqual([3, 4])
    const claimed = changeTournamentReserve(state, { action: 'claim', id: 'reserve', playerId: 4 }, '')
    expect(claimed).toMatchObject({ selectedIds: [1, 2, 4, 3], vkReserves: [{ seats: 1 }], vkReserveOrderRev: 1 })
    const released = changeTournamentReserve(claimed, { action: 'release', id: 'reserve' }, '')
    expect(released.vkReserves).toEqual([])
    expect(queue([1, 2, 4, 3], [])).toEqual([])
  })

  it('uses the team limit and leaves other teams free to accept players', () => {
    const state = { ...upcoming, selectedIds: [1], vkTeamSlots: ['Альфа', 'Бета'], vkTeamLimits: { альфа: 2 },
      vkTeamLabelByPlayerId: { 1: 'Альфа' } }
    const reserved = changeTournamentReserve(state, { action: 'add', seats: 1, team: 'альфа' }, 'reserve')
    expect(reserved.vkReserves).toMatchObject([{ team: 'Альфа', seats: 1 }])
    const claimed = changeTournamentReserve({ ...state, ...reserved, selectedIds: [1, 2, 3],
      vkTeamLabelByPlayerId: { 1: 'Альфа', 2: 'Альфа', 3: 'Бета' } }, { action: 'claim', id: 'reserve', playerId: 4 }, '')
    expect(claimed).toMatchObject({ selectedIds: [1, 4, 2, 3], vkTeamLabelByPlayerId: { 4: 'Альфа' }, vkReserves: [] })
  })

  it('releases one seat per action and only moves one waiting player to the main roster', () => {
    const reserved = changeTournamentReserve(upcoming, { action: 'add', seats: 2 }, 'reserve')
    const state = { ...reserved, selectedIds: [1, 2, 3, 4] }
    const action = { action: 'release', id: 'reserve', expectedSeats: 2 }
    const released = changeTournamentReserve(state, action, '')
    expect(released.vkReserves).toMatchObject([{ id: 'reserve', seats: 1 }])
    expect(() => changeTournamentReserve(released, action, '')).toThrow()
    expect([...computeQueuedPlayerIds({
      orderedIds: state.selectedIds, reserves: released.vkReserves, listLimit: 4,
      teamLabelByPlayerId: {}, teamSlots: [], teamLimits: {},
    })]).toEqual([4])
  })

  it('rejects overbooking, using a reserve on an active participant, and editing after registration', () => {
    expect(() => changeTournamentReserve(upcoming, { action: 'add', seats: 3 }, 'reserve')).toThrow()
    const reserved = changeTournamentReserve(upcoming, { action: 'add', seats: 2 }, 'reserve')
    expect(() => changeTournamentReserve(reserved, { action: 'claim', id: 'reserve', playerId: 1 }, '')).toThrow()
    expect(() => changeTournamentReserve({ ...reserved, step: 1 }, { action: 'release', id: 'reserve' }, '')).toThrow()
  })
})
