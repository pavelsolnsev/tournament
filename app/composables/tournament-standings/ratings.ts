// Этот файл: логика рейтинга игроков по итогам матча.
// Он считает дельты рейтинга и отправляет обновление в API, не блокируя UI.
import type { Ref } from 'vue'
import type { Player } from '~/types/tournament'
import type { PlayerMatchStats } from './types'
import { calculateMatchRatingDelta, round1 } from './ratingCalc'

// Считаем дельты рейтинга для всех игроков одной команды в матче.
// isWin/isDraw/isLose — результат с точки зрения этой команды.
export function computeTeamRatingDeltas(args: {
  playersById: Record<number, Player>
  statsRecord: Record<number, PlayerMatchStats>
  isWin: boolean
  isDraw: boolean
  isLose: boolean
  teamGoals: number
  opponentGoals: number
}): Record<number, number> {
  const { playersById, statsRecord, isWin, isDraw, isLose, teamGoals, opponentGoals } = args
  const deltas: Record<number, number> = {}

  for (const [idStr, stats] of Object.entries(statsRecord)) {
    const playerId = Number(idStr)
    const baseRating = Number(playersById[playerId]?.rating ?? 0)
    deltas[playerId] = calculateMatchRatingDelta(
      stats,
      baseRating,
      isWin,
      isDraw,
      isLose,
      teamGoals,
      opponentGoals,
    )
  }

  return deltas
}

// Накапливаем дельты рейтинга в памяти — БД не трогаем, запись будет при завершении турнира.
export function applyRatingDeltas(args: {
  playerRatingDeltas: Ref<Record<number, number>>
  deltas: Record<number, number>
}) {
  const { playerRatingDeltas, deltas } = args

  for (const [idStr, delta] of Object.entries(deltas)) {
    const playerId = Number(idStr)
    playerRatingDeltas.value[playerId] = round1((playerRatingDeltas.value[playerId] ?? 0) + delta)
  }
}

// Откатываем дельты рейтинга в памяти (при редактировании или удалении матча).
export function revertRatingDeltas(args: {
  playerRatingDeltas: Ref<Record<number, number>>
  deltas: Record<number, number>
}) {
  const invertedDeltas: Record<number, number> = {}
  for (const [idStr, delta] of Object.entries(args.deltas)) {
    invertedDeltas[Number(idStr)] = -delta
  }
  applyRatingDeltas({ playerRatingDeltas: args.playerRatingDeltas, deltas: invertedDeltas })
}

