import type { Player } from '../../app/types/tournament'

// Убирает игрока из состава архивного турнира: только players и assignmentByPlayerId
// (та же пара, что задаёт роспись команд). Матчи, таблицу, статистику и рейтинг не трогаем —
// правка только для показа, чтобы игрок, оказавшийся в составе по ошибке, не отображался.

/** Разбирает players/teams из БД (могут прийти строкой JSON или уже объектом/массивом). */
export function parseArchiveRoster(rawPlayers: unknown, rawAssignment: unknown): {
  players: Player[]
  assignmentByPlayerId: Record<string, string>
} {
  let players: Player[] = []
  try {
    const parsed = typeof rawPlayers === 'string' ? JSON.parse(rawPlayers) : rawPlayers
    players = Array.isArray(parsed) ? parsed : []
  } catch {
    players = []
  }

  let assignmentByPlayerId: Record<string, string> = {}
  try {
    const parsed = typeof rawAssignment === 'string' ? JSON.parse(rawAssignment) : rawAssignment
    assignmentByPlayerId = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    assignmentByPlayerId = {}
  }

  return { players, assignmentByPlayerId }
}

/** Возвращает players и assignmentByPlayerId без указанного игрока. */
export function removePlayerFromArchiveRoster(
  players: Player[],
  assignmentByPlayerId: Record<string, string>,
  playerId: number,
): { players: Player[]; assignmentByPlayerId: Record<string, string> } {
  const nextPlayers = players.filter((p) => Number(p?.id) !== playerId)
  const nextAssignment = { ...assignmentByPlayerId }
  // Ключи assignmentByPlayerId в JSON — строки (id игрока).
  Reflect.deleteProperty(nextAssignment, String(playerId))
  return { players: nextPlayers, assignmentByPlayerId: nextAssignment }
}
