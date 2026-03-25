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

// Применяем дельты рейтинга к накопленному состоянию и отправляем в БД.
export async function applyRatingDeltas(args: {
  playerRatingDeltas: Ref<Record<number, number>>
  deltas: Record<number, number>
}) {
  const { playerRatingDeltas, deltas } = args

  // Накапливаем дельту за турнир в памяти.
  for (const [idStr, delta] of Object.entries(deltas)) {
    const playerId = Number(idStr)
    playerRatingDeltas.value[playerId] = round1((playerRatingDeltas.value[playerId] ?? 0) + delta)
  }

  // Отправляем обновление рейтинга в БД.
  const updates = Object.entries(deltas)
    .filter(([, d]) => d !== 0)
    .map(([id, delta]) => ({ id: Number(id), delta }))

  if (updates.length === 0) return

  await $fetch('/api/players/rating', {
    method: 'PATCH',
    body: { updates },
  }).catch((err) => {
    // Не блокируем UI если запрос упал — рейтинг обновится при следующей загрузке.
    console.error('Failed to update ratings:', err)
  })
}

// Откатываем дельты рейтинга (при редактировании или удалении матча).
export async function revertRatingDeltas(args: {
  playerRatingDeltas: Ref<Record<number, number>>
  deltas: Record<number, number>
}) {
  const invertedDeltas: Record<number, number> = {}
  for (const [idStr, delta] of Object.entries(args.deltas)) {
    invertedDeltas[Number(idStr)] = -delta
  }
  await applyRatingDeltas({ playerRatingDeltas: args.playerRatingDeltas, deltas: invertedDeltas })
}

