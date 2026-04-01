// Статусы матча — три состояния жизненного цикла: ожидание → идёт → завершён.
// upcoming: матч запланирован, команды ещё не выбраны.
// live: обе команды выбраны, матч идёт прямо сейчас.
// finished: турнир завершён (нажали «Завершить турнир»).
export type MatchStatus = 'upcoming' | 'live' | 'finished'

export interface Player {
  id: number
  name: string
  username: string | null
  /** Имя файла в public/player-photos/ (например ivan.jpg); null — показываем инициалы. */
  photo?: string | null
  rating?: number | null
  // Накопленная дельта рейтинга за текущий турнир — считается на клиенте, не хранится в БД.
  ratingDelta?: number
}

export interface Team {
  id: number
  name: string
}
