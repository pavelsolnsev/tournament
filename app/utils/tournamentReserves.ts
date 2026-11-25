import { normalizeTeamName } from './teamNames'

export type TournamentReserve = { id: string; seats: number; team: string; note: string }
export type ReservePlayerRow = { key: string; reserveId: string; seats: number; team: string; note: string; label: string }
export const resolveReservesMessage = 'Заполните или снимите резервные места в списке «В игре».'
export type ReserveAction =
  | { action: 'add'; seats: number; team: string; note: string }
  | { action: 'release'; id: string; expectedSeats: number }
  | { action: 'claim'; id: string; expectedSeats: number; playerId: number }

export function reserveTeamKey(team: string) {
  return normalizeTeamName(team).toLowerCase()
}

export function reserveSeats(reserves: readonly TournamentReserve[], team = '') {
  const key = reserveTeamKey(team)
  return reserves.reduce((sum, item) => sum + (reserveTeamKey(item.team) === key ? item.seats : 0), 0)
}

export function reservePlayerRows(reserves: readonly TournamentReserve[]): ReservePlayerRow[] {
  return reserves.flatMap(reserve =>
    Array.from({ length: reserve.seats }, (_, index) => ({
      key: `${reserve.id}:${index}`,
      reserveId: reserve.id,
      seats: reserve.seats,
      team: reserve.team,
      note: reserve.note,
    })),
  ).map((reserve, index) => ({ ...reserve, label: `Резервный игрок ${index + 1}` }))
}

export function filterReservePlayerRows(rows: ReservePlayerRow[], search: string) {
  const term = search.trim().toLowerCase()
  return rows.filter(reserve => [reserve.label, reserve.team, reserve.note].some(text => text.toLowerCase().includes(term)))
}

export function readTournamentReserves(value: unknown): TournamentReserve[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is TournamentReserve =>
    item != null && typeof item.id === 'string' && Number.isInteger(item.seats) && item.seats > 0 && item.seats <= 200
    && typeof item.team === 'string' && typeof item.note === 'string',
  )
}
