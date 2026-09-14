// Разовые прибавки к рейтингу по итогам всего турнира — поверх дельт за матчи:
// за явку, за звание MVP и за попадание в лучшие бомбардиры, ассистенты или вратари.
import type { PlayerMatchStats } from './types'
import { round1 } from './ratingCalc'

/** Пришёл и сыграл турнир. */
export const ATTENDANCE_BONUS = 0.2
/** MVP турнира. */
export const TOURNAMENT_MVP_BONUS = 2
/** MVP своей команды (если не MVP турнира). */
export const TEAM_MVP_BONUS = 1
/** Лучший бомбардир, ассистент или вратарь — один раз, сколько бы номинаций ни было. */
export const TOP_PLAYER_BONUS = 0.5

/** Поля, по которым считаются «лучшие» турнира. */
const TOP_FIELDS = ['goals', 'assists', 'saves'] as const

/**
 * id лучших по одному показателю: максимум среди тех, у кого он больше нуля.
 * При равенстве попадают все — ровно как на карточках наград в итогах турнира.
 */
export function topPlayerIdsByStat(
  aggregate: Record<number, PlayerMatchStats>,
  field: (typeof TOP_FIELDS)[number],
): Set<number> {
  let max = 0
  for (const stats of Object.values(aggregate ?? {})) {
    const value = Number(stats?.[field]) || 0
    if (value > max) max = value
  }
  const out = new Set<number>()
  if (max <= 0) return out
  for (const [idStr, stats] of Object.entries(aggregate ?? {})) {
    if ((Number(stats?.[field]) || 0) === max) out.add(Number(idStr))
  }
  return out
}

/** id всех, кто стал лучшим хотя бы в одной номинации турнира. */
export function topPlayerIds(aggregate: Record<number, PlayerMatchStats>): Set<number> {
  const out = new Set<number>()
  for (const field of TOP_FIELDS) {
    for (const id of topPlayerIdsByStat(aggregate, field)) out.add(id)
  }
  return out
}

/**
 * Разовая прибавка игроку за турнир. Звания не складываются: MVP турнира перебивает
 * MVP команды, а тот — звание лучшего. Кто в турнире не участвовал, не получает ничего.
 */
export function tournamentRatingBonus(opts: {
  isParticipant: boolean
  isTournamentMvp: boolean
  isTeamMvp: boolean
  isTopPlayer: boolean
}): number {
  if (!opts.isParticipant) return 0
  const award =
    opts.isTournamentMvp ? TOURNAMENT_MVP_BONUS
    : opts.isTeamMvp ? TEAM_MVP_BONUS
    : opts.isTopPlayer ? TOP_PLAYER_BONUS
    : 0
  return round1(ATTENDANCE_BONUS + award)
}
