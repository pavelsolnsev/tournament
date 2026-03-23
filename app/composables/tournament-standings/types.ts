// Этот файл: типы для турнирных standings и match-событий.
// Он задает структуру данных для таблицы, игроков и завершенных матчей.
import type { Player } from '~/types/tournament'

export type PlayerMatchStats = {
  goals: number
  assists: number
  saves: number
  yellows: number
}

export type Side = 'home' | 'away'
export type StatKey = keyof PlayerMatchStats

export type MarkedPlayer = {
  playerId: number
  name: string
  eventsLabel: string
}

export type PlayedMatch = {
  matchNumber: number
  homeTeam: string
  awayTeam: string
  homeGoals: number
  awayGoals: number
  homePlayers: MarkedPlayer[]
  awayPlayers: MarkedPlayer[]
  // Полная статистика — нужна для inline-редактирования завершённого матча.
  homeStats: Record<number, PlayerMatchStats>
  awayStats: Record<number, PlayerMatchStats>
}

// Входные данные для логики турнира.
export type TournamentStandingsParams = {
  teams: string[]
  teamColors: Record<string, number>
  players: Player[]
  assignmentByPlayerId: Record<number, string>
}

