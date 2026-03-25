// Этот файл: логика определения MVP по итогам турнира.
// Портирован из selectMvp.js телеграм-бота (utils/selectMvp.js).
// Используется при завершении турнира для начисления бонуса к рейтингу.

// Вес сейва чуть ниже гола и ассиста (0.75 вместо 1.0).
const SAVES_WEIGHT = 0.75

// Данные об игроке, нужные для выбора MVP.
export type MvpCandidate = {
  id: number
  goals: number
  assists: number
  saves: number
  wins: number
  yellows: number
  // Накопленная дельта рейтинга за турнир (из playerRatingDeltas).
  ratingDelta: number
  // Рейтинг игрока ДО начала турнира (из базы данных).
  baseRating: number
}

// Статистика одной команды — нужна для разрешения ничьих по очкам команды.
export type MvpTeamStat = {
  teamName: string
  wins: number
  draws: number
  goalsFor: number
  goalsAgainst: number
}

// Взвешенные метки: голы + ассисты + сейвы×0.75.
function totalMarks(c: MvpCandidate): number {
  return c.goals + c.assists + c.saves * SAVES_WEIGHT
}

/**
 * Выбирает MVP (лучшего игрока) из списка кандидатов.
 *
 * Приоритеты при равенстве (от высшего к низшему):
 * 1. Взвешенные метки (goals + assists + saves×0.75)
 * 2. Голы
 * 3. Ассисты
 * 4. Сейвы
 * 5. Очки команды (wins×3 + draws) — если переданы teamStats
 * 6. Разница мячей команды (goalsFor − goalsAgainst)
 * 7. Прирост рейтинга за турнир (ratingDelta)
 * 8. Меньше жёлтых карточек
 * 9. Больше личных побед
 * 10. Выше базовый рейтинг на старте
 * 11. Меньший id (детерминированный выбор)
 */
export function selectMvp(
  candidates: MvpCandidate[],
  options?: {
    assignmentByPlayerId?: Record<number, string>
    teamStats?: MvpTeamStat[]
  },
): MvpCandidate | null {
  if (candidates.length === 0) return null

  const { assignmentByPlayerId = {}, teamStats = [] } = options ?? {}

  // Находим статистику команды для игрока по его id.
  function teamStatFor(id: number): MvpTeamStat | undefined {
    if (!teamStats.length) return undefined
    const name = assignmentByPlayerId[id]
    return teamStats.find((t) => t.teamName === name)
  }

  function teamPoints(c: MvpCandidate): number {
    const t = teamStatFor(c.id)
    if (!t) return 0
    // Считаем очки команды: 3 за победу, 1 за ничью.
    return t.wins * 3 + t.draws
  }

  function teamGoalDiff(c: MvpCandidate): number {
    const t = teamStatFor(c.id)
    if (!t) return 0
    return t.goalsFor - t.goalsAgainst
  }

  // Идём по кандидатам и оставляем лучшего (или нескольких при полном равенстве).
  const best = candidates.reduce<MvpCandidate[]>((acc, c) => {
    if (!acc.length) return [c]
    // После guard выше acc точно не пуст — используем non-null assertion.
    const top = acc[0]!

    // 1. Взвешенные метки.
    const cM = totalMarks(c)
    const topM = totalMarks(top)
    if (cM > topM) return [c]
    if (cM < topM) return acc

    // 2. Голы.
    if (c.goals > top.goals) return [c]
    if (c.goals < top.goals) return acc

    // 3. Ассисты.
    if (c.assists > top.assists) return [c]
    if (c.assists < top.assists) return acc

    // 4. Сейвы.
    if (c.saves > top.saves) return [c]
    if (c.saves < top.saves) return acc

    // 5–6. Очки и разница мячей команды.
    if (teamStats.length > 0 && assignmentByPlayerId) {
      const cTP = teamPoints(c)
      const topTP = teamPoints(top)
      if (cTP > topTP) return [c]
      if (cTP < topTP) return acc

      const cGD = teamGoalDiff(c)
      const topGD = teamGoalDiff(top)
      if (cGD > topGD) return [c]
      if (cGD < topGD) return acc
    }

    // 7. Прирост рейтинга за турнир.
    if (c.ratingDelta > top.ratingDelta) return [c]
    if (c.ratingDelta < top.ratingDelta) return acc

    // 8. Меньше жёлтых карточек — более дисциплинированный.
    if (c.yellows < top.yellows) return [c]
    if (c.yellows > top.yellows) return acc

    // 9. Больше личных побед.
    if (c.wins > top.wins) return [c]
    if (c.wins < top.wins) return acc

    // 10. Выше базовый рейтинг на старте турнира.
    if (c.baseRating > top.baseRating) return [c]
    if (c.baseRating < top.baseRating) return acc

    // 11. Детерминированный выбор: меньший id побеждает.
    if (c.id < top.id) return [c]
    if (c.id > top.id) return acc

    return [...acc, c]
  }, [])

  // Если несколько игроков абсолютно равны — берём с меньшим id.
  return best.length === 1
    ? (best[0] ?? null)
    : best.reduce<MvpCandidate>((a, b) => (a.id <= b.id ? a : b), best[0]!)
}
