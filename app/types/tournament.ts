export interface Player {
  id: number
  name: string
  username: string | null
  rating?: number | null
  // Накопленная дельта рейтинга за текущий турнир — считается на клиенте, не хранится в БД.
  ratingDelta?: number
}

export interface Team {
  id: number
  name: string
}
