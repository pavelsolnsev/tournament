// Этот файл: хелперы для событий матча.
// Он превращает статистику игрока (голы/пас/сейвы/желтые) в готовые подписи для UI.
import type { MarkedPlayer, PlayerMatchStats } from './types'
import type { Player } from '~/types/tournament'
import { clipLongPlayerLabel } from '~/composables/usePlayerDisplay'

// Этот хелпер делает текст подписи под события игрока (голы/пас/сейвы/желтые).
export function buildEventsLabel(stats: PlayerMatchStats): string {
  const parts: string[] = []
  if (stats.goals > 0) parts.push(`⚽ ${stats.goals}`)
  if (stats.assists > 0) parts.push(`🎯 ${stats.assists}`)
  if (stats.saves > 0) parts.push(`🧤 ${stats.saves}`)
  if (stats.yellows > 0) parts.push(`🟨 ${stats.yellows}`)
  return parts.join(' ')
}

// Этот хелпер переводит record со статистикой в список объектов для отрисовки UI.
export function extractMarkedPlayers(args: {
  statsRecord: Record<number, PlayerMatchStats>
  playersById: Record<number, Player>
  displayPlayerLabel: (player: Player) => string
}): MarkedPlayer[] {
  const { statsRecord, playersById, displayPlayerLabel } = args
  const res: MarkedPlayer[] = []

  for (const [playerIdStr, stats] of Object.entries(statsRecord)) {
    const playerId = Number(playerIdStr)
    const total = stats.goals + stats.assists + stats.saves + stats.yellows
    // Если у игрока нет событий — не показываем его в списке.
    if (!total) continue

    const player = playersById[playerId]
    const name = player
      ? displayPlayerLabel(player)
      : clipLongPlayerLabel(`Игрок #${playerId}`)

    res.push({
      playerId,
      name,
      eventsLabel: buildEventsLabel(stats),
    })
  }

  // Делаем порядок стабильным.
  res.sort((a, b) => a.playerId - b.playerId)
  return res
}

