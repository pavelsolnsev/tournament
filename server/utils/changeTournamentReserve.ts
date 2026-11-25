import { createError } from 'h3'
import { computeQueuedPlayerIds, teamLimitFor } from '../../app/utils/tournamentQueue'
import { readTournamentReserves, reserveSeats, reserveTeamKey } from '../../app/utils/tournamentReserves'
import { parseSelectedIds, parseVkListLimit, parseVkTeamLabelMap, parseVkTeamLimits, parseVkTeamSlots } from './tournamentPaidPlayers'
import { bumpRosterRev } from './tournamentRosterRev'

function reserveError(message: string, statusCode = 400) {
  return createError({ statusCode, data: { message } })
}

export function changeTournamentReserve(state: Record<string, unknown>, body: Record<string, unknown>, newId: string) {
  if (Number(state.step ?? 0) !== 0 || state.matchStatus === 'live' || state.matchStatus === 'finished') {
    throw reserveError('Резервы доступны, пока открыт набор игроков.', 409)
  }
  const reserves = readTournamentReserves(state.vkReserves)
  const orderedIds = parseSelectedIds(state.selectedIds)
  const slots = parseVkTeamSlots(state.vkTeamSlots)
  const labels = parseVkTeamLabelMap(state.vkTeamLabelByPlayerId)
  const limits = parseVkTeamLimits(state.vkTeamLimits)
  const listLimit = parseVkListLimit(state.vkListLimit) ?? parseVkListLimit(state.vkListDefaultLimit) ?? 20
  const queue = () => computeQueuedPlayerIds({ orderedIds, teamLabelByPlayerId: labels, teamSlots: slots, teamLimits: limits, listLimit, reserves })

  if (body.action === 'add') {
    const key = typeof body.team === 'string' ? reserveTeamKey(body.team) : ''
    const team = slots.length ? slots.find(slot => reserveTeamKey(slot) === key) : ''
    if (team === undefined || (!slots.length && key)) throw reserveError('Выберите команду из списка.')
    const seats = Number(body.seats)
    if (!Number.isInteger(seats) || seats < 1 || seats > 200) throw reserveError('Укажите количество мест.')
    const capacity = team ? teamLimitFor(limits, team) : listLimit
    const used = team ? orderedIds.filter(id => reserveTeamKey(labels[id] ?? '') === key).length : orderedIds.length
    if (seats > capacity - used - reserveSeats(reserves, team)) {
      throw reserveError('В списке нет столько свободных мест. Проверьте лимит и очередь.', 409)
    }
    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 120) : ''
    return {
      ...state, selectedIds: orderedIds, vkListLimit: team ? state.vkListLimit : listLimit,
      vkReserves: [...reserves, { id: newId, seats, team, note }],
    }
  }

  if (body.action !== 'release' && body.action !== 'claim') throw reserveError('Выберите действие с резервом.')
  const reserve = reserves.find(item => item.id === body.id)
  if (!reserve) throw reserveError('Этот резерв уже снят или заполнен. Обновите список.', 409)
  if (body.expectedSeats !== undefined && body.expectedSeats !== reserve.seats) {
    throw reserveError('Количество мест в резерве изменилось. Обновите список.', 409)
  }
  const remaining = reserves.flatMap(item => item.id !== reserve.id ? [item] : item.seats > 1 ? [{ ...item, seats: item.seats - 1 }] : [])
  if (body.action === 'release') return { ...state, vkReserves: remaining }

  const playerId = Number(body.playerId)
  if (!Number.isSafeInteger(playerId) || playerId <= 0) throw reserveError('Выберите игрока.')
  const queued = queue()
  if (orderedIds.includes(playerId) && !queued.has(playerId)) throw reserveError('Этот игрок уже в основном составе.', 409)
  const teamKey = reserveTeamKey(reserve.team)
  const nextIds = orderedIds.filter(id => id !== playerId)
  const firstWaiting = nextIds.findIndex(id => queued.has(id) && (!reserve.team || reserveTeamKey(labels[id] ?? '') === teamKey))
  nextIds.splice(firstWaiting === -1 ? nextIds.length : firstWaiting, 0, playerId)
  if (reserve.team) labels[playerId] = reserve.team
  const after = computeQueuedPlayerIds({ orderedIds: nextIds, teamLabelByPlayerId: labels, teamSlots: slots, teamLimits: limits, listLimit, reserves: remaining })
  if (after.has(playerId)) throw reserveError('Место команды больше недоступно. Проверьте лимит.', 409)
  const next: Record<string, unknown> = {
    ...state, selectedIds: nextIds, vkTeamLabelByPlayerId: labels, vkReserves: remaining,
    vkReserveOrderRev: (Number(state.vkReserveOrderRev) || 0) + 1,
  }
  bumpRosterRev(next)
  return next
}
