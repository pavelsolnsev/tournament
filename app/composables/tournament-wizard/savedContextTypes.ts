import type { MatchStatus } from '~/types/tournament'
import type { PlayedMatch, PlayerMatchStats } from '~/composables/tournament-standings/types'
import type { StandingsRow } from '~/components/organisms/standings/Table.vue'

/** Снапшот состояния турнирной таблицы — сохраняется отдельно при каждом изменении матчей. */
export type SavedStandingsSnapshot = {
  standingsRows: StandingsRow[]
  playedMatchesList: PlayedMatch[]
  aggregatePlayerStats: Record<number, PlayerMatchStats>
  matchCount: number
  teamGamesCount: Record<string, number>
  consecutiveGames: Record<string, number>
  matchHistory: Record<string, Record<string, number>>
  lastMatchIndex: Record<string, Record<string, number>>
  playedSingleMatch: boolean
  playerRatingDeltas: Record<number, number>
  currentHomeTeam: string
  currentAwayTeam: string
  /** Итоговые отметки текущего матча (добавленное минус снятое) — их читают зритель и протокол. */
  currentHomeStats: Record<number, PlayerMatchStats>
  currentAwayStats: Record<number, PlayerMatchStats>
  /** Сырые счётчики текущего матча: только растут, поэтому сливаются между устройствами по максимуму. */
  currentHomeStatsAdded?: Record<number, PlayerMatchStats>
  currentHomeStatsRemoved?: Record<number, PlayerMatchStats>
  currentAwayStatsAdded?: Record<number, PlayerMatchStats>
  currentAwayStatsRemoved?: Record<number, PlayerMatchStats>
  /**
   * Версия истории матчей: растёт при завершении, удалении и правке сыгранного матча.
   * Устройства сравнивают её, чтобы отставшая вкладка не откатила чужой сыгранный матч.
   */
  historyRev?: number
}

/** Полный контекст мастера — сериализуется в БД. */
export type SavedTournamentContext = {
  step: number
  tournamentName: string
  tournamentDate: string
  venueLabel: string
  formatLabel: string
  selectedIds: number[]
  /** id игроков с отметкой оплаты (синхрон с ВК через roster-snapshot и POST vk/player-paid). */
  paidPlayerIds?: number[]
  /** Подписи команд из ВК (кнопки teamSlots); ключ — id игрока в виде строки для JSON. */
  vkTeamLabelByPlayerId?: Record<string, string>
  /** Слоты с кнопок бота (s tr A B) — заданы при link-event. */
  vkTeamSlots?: string[]
  /** Лимиты команд для турнирного списка ВК; ключ — нормализованное имя команды (нижний регистр). */
  vkTeamLimits?: Record<string, number>
  /** Общий лимит списка ВК (без команд). Если задан — игроки сверх него уходят в очередь. */
  vkListLimit?: number
  /** true только для списка турнира в боте (s tr) — на шаге «Игроки» показываются команды ВК. */
  vkListTournament?: boolean
  /**
   * Монотонная версия состава (игроки, расстановка по командам, команды с цветами).
   * Менять состав может только PUT с версией больше сохранённой — так отметки судьи
   * и отставшие вкладки не откатывают правку админа или запись игрока из ВК.
   */
  rosterRev?: number
  assignmentByPlayerId: Record<number, string>
  confirmedTeamNames: string[]
  teamColors: Record<string, number>
  standingsSnapshot: SavedStandingsSnapshot | null
  matchStatus: MatchStatus
  liveHomeTeam: string
  liveAwayTeam: string
  /**
   * Только в теле PUT /api/tournament/state: явное разрешение полного сброса (кнопки «Очистить данные» / «Завершить турнир»).
   * На сервере удаляется и в БД не попадает.
   */
  __fullReset?: true
  /**
   * Только в теле PUT /api/tournament/state: слоты команд в этом теле заданы админом осознанно,
   * поэтому пустой массив означает «команд больше нет», а не «вкладка их не знает».
   * На сервере удаляется и в БД не попадает.
   */
  __vkTeamSlotsAuthoritative?: true
}
