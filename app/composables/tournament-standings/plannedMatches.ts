// Этот файл: сколько матчей обычно играют в турнире и на каком мы сейчас.
// Он нужен, чтобы судье показать подсказку: последний матч — жми «Показать итоги».

/** Сколько игр обычно у каждой команды: 4 команды — по 9, 3 команды — по 8. */
const GAMES_PER_TEAM: Record<number, number> = {
  3: 8,
  4: 9,
}

export type MatchProgressPhase = 'regular' | 'last' | 'done'

export type MatchProgress = {
  /** Сколько матчей планируется всего (4 команды → 18, 3 команды → 12). */
  total: number
  /** Номер матча, который идёт сейчас (сыгранных + 1). */
  current: number
  /** regular — играем; last — идёт последний матч; done — все матчи уже сыграны. */
  phase: MatchProgressPhase
}

/** Всего матчей: каждая игра — это двое, поэтому команды × игры ÷ 2. Для других составов — null. */
export function plannedMatchesTotal(teamCount: number): number | null {
  const games = GAMES_PER_TEAM[teamCount]
  if (!games) return null
  return (teamCount * games) / 2
}

/** Где мы в турнире; null — если число команд необычное и плана нет (подсказку не показываем). */
export function getMatchProgress(teamCount: number, playedCount: number): MatchProgress | null {
  const total = plannedMatchesTotal(teamCount)
  if (total === null) return null

  // Отрицательные и дробные значения на всякий случай приводим к нормальному числу.
  const played = Math.max(0, Math.floor(Number(playedCount) || 0))
  let phase: MatchProgressPhase = 'regular'
  if (played >= total) phase = 'done'
  else if (played === total - 1) phase = 'last'

  return { total, current: Math.min(played + 1, total), phase }
}
