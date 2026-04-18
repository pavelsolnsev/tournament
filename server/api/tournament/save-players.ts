import type { PoolConnection } from 'mysql2/promise'
import { normalizePlayerUsername } from '../../utils/normalizePlayerUsername'

// Тип данных игрока, который приходит с клиента при завершении турнира.
export type PlayerTournamentData = {
  id: number
  name: string
  username: string | null
  goals: number
  assists: number
  saves: number
  gamesPlayed: number
  wins: number
  draws: number
  losses: number
  ratingDelta: number
  mvp: number
  yellowCards: number
}

// Сохраняет/обновляет статистику игроков после завершения турнира.
// Логика: поля статистики накапливаются (+=), rating обновляется (текущий + delta).
export async function savePlayersToDb(players: PlayerTournamentData[], conn: PoolConnection) {
  if (players.length === 0) return

  // Получаем текущие рейтинги игроков одним запросом — нужны для точного прибавления delta.
  const ids = players.map((p) => p.id)
  const [ratingRows] = await conn.query(
    'SELECT id, rating FROM players WHERE id IN (?)',
    [ids],
  ) as [Array<{ id: number; rating: number }>, unknown]

  // Строим словарь id → текущий рейтинг.
  const ratingMap = new Map(ratingRows.map((r) => [r.id, Number(r.rating) || 0]))

  // Собираем значения для пакетного INSERT ... ON DUPLICATE KEY UPDATE.
  const values = players.map((p) => {
    const currentRating = ratingMap.get(p.id) ?? 0
    // Рейтинг не может превышать 200 и быть ниже 0.
    const newRating = Math.min(Math.max(currentRating + p.ratingDelta, 0), 200)
    return [
      p.id,
      p.name || 'Unknown',
      normalizePlayerUsername(p.username),
      p.goals,
      p.assists,
      p.saves,
      p.gamesPlayed,
      p.wins,
      p.draws,
      p.losses,
      newRating,
      p.mvp,
      p.yellowCards,
    ]
  })

  // ON DUPLICATE KEY UPDATE: статистика накапливается, rating обновляется.
  await conn.query(
    `INSERT INTO players
       (id, name, username, goals, assists, saves, gamesPlayed, wins, draws, losses, rating, mvp, yellow_cards)
     VALUES ?
     ON DUPLICATE KEY UPDATE
       name          = VALUES(name),
       username      = VALUES(username),
       goals         = goals         + VALUES(goals),
       assists       = assists       + VALUES(assists),
       saves         = saves         + VALUES(saves),
       gamesPlayed   = gamesPlayed   + VALUES(gamesPlayed),
       wins          = wins          + VALUES(wins),
       draws         = draws         + VALUES(draws),
       losses        = losses        + VALUES(losses),
       rating        = VALUES(rating),
       mvp           = mvp           + VALUES(mvp),
       yellow_cards  = yellow_cards  + VALUES(yellow_cards)`,
    [values],
  )
}
