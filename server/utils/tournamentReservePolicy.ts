import { createError } from 'h3'
import { reserveTeamKey, resolveReservesMessage, type TournamentReserve } from '../../app/utils/tournamentReserves'

export function reserveFitsTeamSlots(reserve: TournamentReserve, slots: string[]) {
  const key = reserveTeamKey(reserve.team)
  return key ? slots.some(slot => reserveTeamKey(slot) === key) : slots.length === 0
}

export function throwUnresolvedReserves(): never {
  throw createError({ statusCode: 409, data: { message: resolveReservesMessage } })
}
