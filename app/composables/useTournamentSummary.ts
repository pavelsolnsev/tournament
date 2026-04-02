// Этот файл: composable для вычисления итогов турнира.
// Считает лучших игроков, статистику матчей и командные результаты.
import type { Player } from '~/types/tournament'
import type { PlayedMatch, PlayerMatchStats } from '~/composables/tournament-standings/types'
import type { StandingsRow } from '~/components/organisms/standings/Table.vue'
import { displayPlayerLabelWithoutRating } from '~/composables/usePlayerDisplay'
import { useTeamColors } from '~/composables/useTeamColors'

// Один игрок-победитель в категории (может быть несколько при одинаковом показателе).
export type AwardWinner = {
  playerId: number
  name: string
  // Фото игрока — имя файла из БД, используется для PlayerAvatar.
  photo?: string | null
  teamName: string
  // Маркер-эмодзи команды — цветной кружок команды.
  teamMarker: string
  value: number
  // Статистика за весь турнир — для строки отметок у MVP (голы/пасы/сейвы/жёлтые).
  tournamentStats?: PlayerMatchStats
}

// MVP команды — лучший игрок отдельной команды.
export type TeamMvp = {
  teamName: string
  teamMarker: string
  players: AwardWinner[]
  goals: number
  assists: number
  saves: number
}

// Итоговая статистика всего турнира.
export type TournamentSummaryStats = {
  totalMatches: number
  totalGoals: number
  avgGoalsPerMatch: number
  topScoringMatch: PlayedMatch | null
  topScoringMatchGoals: number
}

// Игрок получивший жёлтые карточки — для блока дисциплины.
export type YellowCardPlayer = {
  playerId: number
  name: string
  photo?: string | null
  teamName: string
  teamMarker: string
  // Количество жёлтых карточек за весь турнир.
  count: number
}

// Итог турнира — все данные для отображения раздела.
export type TournamentSummary = {
  mvp: AwardWinner[]
  topScorers: AwardWinner[]
  topAssisters: AwardWinner[]
  topGoalkeepers: AwardWinner[]
  // Игроки с жёлтыми карточками, отсортированные по убыванию.
  yellowCards: YellowCardPlayer[]
  teamMvps: TeamMvp[]
  stats: TournamentSummaryStats
  standingsRows: StandingsRow[]
}

type SummaryParams = {
  // Все игроки турнира.
  players: Player[]
  // Назначение игроков по командам.
  assignmentByPlayerId: Record<number, string>
  // Суммарная статистика каждого игрока за весь турнир.
  aggregatePlayerStats: Record<number, PlayerMatchStats>
  // Список сыгранных матчей.
  playedMatchesList: PlayedMatch[]
  // Итоговая турнирная таблица.
  standingsRows: StandingsRow[]
  // Дельты рейтинга — нужны для выбора MVP.
  playerRatingDeltas: Record<number, number>
}

// Возвращает маркер-эмодзи команды по её имени из таблицы standings.
// Индекс в таблице определяет цвет: 0 → 🔴, 1 → 🔵 и т.д.
function resolveTeamMarker(
  teamName: string,
  standingsRows: StandingsRow[],
  getMarkerByIndex: (i: number) => string,
): string {
  const idx = standingsRows.findIndex((r) => r.teamName === teamName)
  return getMarkerByIndex(idx >= 0 ? idx : 0)
}

// Находим всех игроков с максимальным значением по нужному полю.
// Если несколько игроков набрали одинаковое — показываем всех.
function findTopPlayers(
  players: Player[],
  assignmentByPlayerId: Record<number, string>,
  aggregateStats: Record<number, PlayerMatchStats>,
  field: keyof PlayerMatchStats,
  standingsRows: StandingsRow[],
  getMarkerByIndex: (i: number) => string,
): AwardWinner[] {
  // Собираем игроков у которых есть хотя бы одно значение в поле.
  const withValue = players.map((p) => {
    const teamName = assignmentByPlayerId[p.id] ?? ''
    return {
      playerId: p.id,
      name: displayPlayerLabelWithoutRating(p),
      photo: p.photo ?? null,
      teamName,
      teamMarker: resolveTeamMarker(teamName, standingsRows, getMarkerByIndex),
      value: aggregateStats[p.id]?.[field] ?? 0,
    }
  }).filter((p) => p.value > 0)

  if (withValue.length === 0) return []

  // Максимальное значение среди всех игроков.
  const maxValue = Math.max(...withValue.map((p) => p.value))

  // Возвращаем только тех, у кого максимум.
  return withValue.filter((p) => p.value === maxValue)
}

// Выбираем лучшего игрока команды по взвешенной формуле (как в selectMvp, но проще).
// Приоритет: голы + ассисты + сейвы × 0.75, затем рейтингдельта, затем id.
function findTeamMvp(
  teamPlayers: Player[],
  aggregateStats: Record<number, PlayerMatchStats>,
  playerRatingDeltas: Record<number, number>,
): Player | null {
  if (teamPlayers.length === 0) return null

  // Считаем «вес» каждого игрока.
  return teamPlayers.reduce<Player | null>((best, p) => {
    if (!best) return p
    const pStats = aggregateStats[p.id] ?? { goals: 0, assists: 0, saves: 0, yellows: 0 }
    const bStats = aggregateStats[best.id] ?? { goals: 0, assists: 0, saves: 0, yellows: 0 }

    const pMark = pStats.goals + pStats.assists + pStats.saves * 0.75
    const bMark = bStats.goals + bStats.assists + bStats.saves * 0.75

    // 1. Взвешенные метки.
    if (pMark > bMark) return p
    if (pMark < bMark) return best

    // 2. Только голы.
    if (pStats.goals > bStats.goals) return p
    if (pStats.goals < bStats.goals) return best

    // 3. Прирост рейтинга.
    const pDelta = playerRatingDeltas[p.id] ?? 0
    const bDelta = playerRatingDeltas[best.id] ?? 0
    if (pDelta > bDelta) return p
    if (pDelta < bDelta) return best

    // 4. Меньший id — детерминированный выбор.
    return p.id < best.id ? p : best
  }, null)
}

// Определяем MVP всего турнира — игрок с лучшей суммарной статистикой.
// Логика такая же как в useFinishTournament, чтобы не расходиться с реальными данными.
function findTournamentMvp(
  players: Player[],
  assignmentByPlayerId: Record<number, string>,
  aggregateStats: Record<number, PlayerMatchStats>,
  playerRatingDeltas: Record<number, number>,
  standingsRows: StandingsRow[],
  getMarkerByIndex: (i: number) => string,
): AwardWinner[] {
  if (players.length === 0) return []

  // Строим карту очков команды для критерия приоритета.
  const teamPointsMap: Record<string, number> = {}
  for (const row of standingsRows) {
    teamPointsMap[row.teamName] = row.points
  }

  // Оцениваем каждого игрока.
  const scored = players.map((p) => {
    const s = aggregateStats[p.id] ?? { goals: 0, assists: 0, saves: 0, yellows: 0 }
    const teamName = assignmentByPlayerId[p.id] ?? ''
    const teamPoints = teamPointsMap[teamName] ?? 0
    const ratingDelta = playerRatingDeltas[p.id] ?? 0
    return {
      playerId: p.id,
      name: displayPlayerLabelWithoutRating(p),
      photo: p.photo ?? null,
      teamName,
      teamMarker: resolveTeamMarker(teamName, standingsRows, getMarkerByIndex),
      value: s.goals + s.assists,
      goals: s.goals,
      assists: s.assists,
      saves: s.saves,
      yellows: s.yellows,
      mark: s.goals + s.assists + s.saves * 0.75,
      teamPoints,
      ratingDelta,
    }
  })

  // Находим максимальный балл.
  const topMark = Math.max(...scored.map((s) => s.mark))
  if (topMark <= 0) return []

  // Фильтруем кандидатов с максимальным баллом.
  let topCandidates = scored.filter((s) => s.mark === topMark)

  // Если один — возвращаем сразу.
  if (topCandidates.length === 1) {
    const c = topCandidates[0]!
    return [{
      playerId: c.playerId,
      name: c.name,
      photo: c.photo,
      teamName: c.teamName,
      teamMarker: c.teamMarker,
      value: c.goals,
      tournamentStats: { goals: c.goals, assists: c.assists, saves: c.saves, yellows: c.yellows },
    }]
  }

  // Если несколько — сортируем по дополнительным критериям.
  topCandidates.sort((a, b) => {
    if (b.goals !== a.goals) return b.goals - a.goals
    if (b.teamPoints !== a.teamPoints) return b.teamPoints - a.teamPoints
    if (b.ratingDelta !== a.ratingDelta) return b.ratingDelta - a.ratingDelta
    return a.playerId - b.playerId
  })

  // Берём лучшего и всех с точно таким же полным набором показателей.
  const best = topCandidates[0]!
  const winners = topCandidates.filter(
    (c) =>
      c.goals === best.goals &&
      c.teamPoints === best.teamPoints &&
      c.ratingDelta === best.ratingDelta,
  )

  return winners.map((c) => ({
    playerId: c.playerId,
    name: c.name,
    photo: c.photo,
    teamName: c.teamName,
    teamMarker: c.teamMarker,
    value: c.goals,
    tournamentStats: { goals: c.goals, assists: c.assists, saves: c.saves, yellows: c.yellows },
  }))
}

// Основной composable — вычисляет все итоги турнира из снапшота.
export function useTournamentSummary(params: SummaryParams): TournamentSummary {
  const { getMarkerByIndex } = useTeamColors()

  // MVP всего турнира.
  const mvp = findTournamentMvp(
    params.players,
    params.assignmentByPlayerId,
    params.aggregatePlayerStats,
    params.playerRatingDeltas,
    params.standingsRows,
    getMarkerByIndex,
  )

  // Лучший бомбардир — больше всего голов.
  const topScorers = findTopPlayers(
    params.players,
    params.assignmentByPlayerId,
    params.aggregatePlayerStats,
    'goals',
    params.standingsRows,
    getMarkerByIndex,
  )

  // Лучший ассистент — больше всего передач.
  const topAssisters = findTopPlayers(
    params.players,
    params.assignmentByPlayerId,
    params.aggregatePlayerStats,
    'assists',
    params.standingsRows,
    getMarkerByIndex,
  )

  // Лучший вратарь — больше всего сейвов.
  const topGoalkeepers = findTopPlayers(
    params.players,
    params.assignmentByPlayerId,
    params.aggregatePlayerStats,
    'saves',
    params.standingsRows,
    getMarkerByIndex,
  )

  // MVP каждой команды — по одному лучшему на команду.
  const uniqueTeams = [...new Set(Object.values(params.assignmentByPlayerId))]
  const teamMvps: TeamMvp[] = uniqueTeams.map((teamName) => {
    const teamPlayers = params.players.filter(
      (p) => params.assignmentByPlayerId[p.id] === teamName,
    )
    const mvpPlayer = findTeamMvp(teamPlayers, params.aggregatePlayerStats, params.playerRatingDeltas)
    const stats = mvpPlayer ? (params.aggregatePlayerStats[mvpPlayer.id] ?? { goals: 0, assists: 0, saves: 0, yellows: 0 }) : { goals: 0, assists: 0, saves: 0, yellows: 0 }

    // Маркер команды — по индексу в итоговой таблице.
    const marker = resolveTeamMarker(teamName, params.standingsRows, getMarkerByIndex)

    const players: AwardWinner[] = mvpPlayer
      ? [{
          playerId: mvpPlayer.id,
          name: displayPlayerLabelWithoutRating(mvpPlayer),
          photo: mvpPlayer.photo ?? null,
          teamName,
          teamMarker: marker,
          value: stats.goals,
        }]
      : []

    return {
      teamName,
      teamMarker: marker,
      players,
      goals: stats.goals,
      assists: stats.assists,
      saves: stats.saves,
    }
  })

  // Общая статистика турнира.
  const totalMatches = params.playedMatchesList.length
  const totalGoals = params.playedMatchesList.reduce(
    (sum, m) => sum + m.homeGoals + m.awayGoals,
    0,
  )
  const avgGoalsPerMatch = totalMatches > 0
    ? Math.round((totalGoals / totalMatches) * 10) / 10
    : 0

  // Самый результативный матч.
  const topScoringMatch = params.playedMatchesList.reduce<PlayedMatch | null>((best, m) => {
    if (!best) return m
    const total = m.homeGoals + m.awayGoals
    const bestTotal = best.homeGoals + best.awayGoals
    return total > bestTotal ? m : best
  }, null)
  const topScoringMatchGoals = topScoringMatch
    ? topScoringMatch.homeGoals + topScoringMatch.awayGoals
    : 0

  // Собираем всех игроков у кого есть жёлтые карточки, сортируем по убыванию.
  const yellowCards: YellowCardPlayer[] = params.players
    .filter(p => (params.aggregatePlayerStats[p.id]?.yellows ?? 0) > 0)
    .map(p => {
      const teamName = params.assignmentByPlayerId[p.id] ?? ''
      const marker = resolveTeamMarker(teamName, params.standingsRows, getMarkerByIndex)
      return {
        playerId: p.id,
        name: displayPlayerLabelWithoutRating(p),
        photo: p.photo ?? null,
        teamName,
        teamMarker: marker,
        count: params.aggregatePlayerStats[p.id]?.yellows ?? 0,
      }
    })
    .sort((a, b) => b.count - a.count)

  return {
    mvp,
    topScorers,
    topAssisters,
    topGoalkeepers,
    yellowCards,
    teamMvps,
    stats: {
      totalMatches,
      totalGoals,
      avgGoalsPerMatch,
      topScoringMatch,
      topScoringMatchGoals,
    },
    standingsRows: params.standingsRows,
  }
}
