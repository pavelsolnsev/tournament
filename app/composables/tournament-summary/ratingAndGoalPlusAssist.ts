// Этот файл: два раздела итогов турнира — «Гол + пас» и «Рейтинг за турнир».
// Чистая логика без Vue: на вход игроки, статистика и изменения рейтинга, на выход строки для показа.
import type { Player } from '~/types/tournament'
import type { PlayerMatchStats } from '~/composables/tournament-standings/types'
import type { AwardWinner } from '~/composables/tournament-summary/types'
import { displayPlayerLabelWithoutRating } from '~/composables/usePlayerDisplay'

/** Сколько игроков показывать в «вверх» и «вниз». */
const RATING_ROWS = 3

/** Строка победителя/игрока: имя, фото, команда и её маркер. */
type RowFactory = (p: Player, value: number) => AwardWinner

export function makeRowFactory(
  assignmentByPlayerId: Record<number, string>,
  aggregateStats: Record<number, PlayerMatchStats>,
  markerForTeam: (teamName: string) => string,
): RowFactory {
  return (p, value) => {
    const teamName = assignmentByPlayerId[p.id] ?? ''
    return {
      playerId: p.id,
      name: displayPlayerLabelWithoutRating(p),
      photo: p.photo ?? null,
      teamName,
      teamMarker: markerForTeam(teamName),
      value,
      tournamentStats: aggregateStats[p.id],
    }
  }
}

/** Лучшие по сумме голов и передач. Ничья — показываем всех с одинаковой суммой. Никто не забил и не отдал — пусто. */
export function findTopGoalPlusAssist(
  players: Player[],
  aggregateStats: Record<number, PlayerMatchStats>,
  toRow: RowFactory,
): AwardWinner[] {
  const sumOf = (id: number) => (aggregateStats[id]?.goals ?? 0) + (aggregateStats[id]?.assists ?? 0)
  const best = players.reduce((max, p) => Math.max(max, sumOf(p.id)), 0)
  if (best <= 0) return []
  return players.filter((p) => sumOf(p.id) === best).map((p) => toRow(p, best))
}

export type RatingChanges = {
  /** Больше всех прибавили (по убыванию). */
  up: AwardWinner[]
  /** Больше всех потеряли (сначала самый большой минус). */
  down: AwardWinner[]
  /** true — итог вместе с бонусами за турнир; false — только изменение за матчи (старые архивы, идущий турнир). */
  withTournamentBonus: boolean
}

/**
 * Рейтинг за турнир. Полный итог (матчи + бонусы за явку и звания) сохраняется в архив при завершении
 * турнира; в старых архивах его нет — тогда берём изменение за матчи.
 */
export function buildRatingChanges(
  players: Player[],
  assignmentByPlayerId: Record<number, string>,
  matchDeltas: Record<number, number> | undefined,
  tournamentDeltas: Record<number, number> | undefined,
  toRow: RowFactory,
): RatingChanges {
  const withTournamentBonus = !!tournamentDeltas && Object.keys(tournamentDeltas).length > 0
  const deltas = (withTournamentBonus ? tournamentDeltas : matchDeltas) ?? {}

  // Только игроки, которые реально играли в турнире (разведены по командам).
  const rows = players
    .filter((p) => Boolean(assignmentByPlayerId[p.id]))
    .map((p) => ({ p, d: Math.round(Number(deltas[p.id] ?? 0) * 10) / 10 }))
    .filter((r) => Number.isFinite(r.d) && r.d !== 0)

  const up = rows.filter((r) => r.d > 0).sort((a, b) => b.d - a.d).slice(0, RATING_ROWS)
  const down = rows.filter((r) => r.d < 0).sort((a, b) => a.d - b.d).slice(0, RATING_ROWS)

  return {
    up: up.map((r) => toRow(r.p, r.d)),
    down: down.map((r) => toRow(r.p, r.d)),
    withTournamentBonus,
  }
}
