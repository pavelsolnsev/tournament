// Суммируем события игроков по всем завершённым матчам турнира.
import type { PlayerMatchStats } from './types'

// Добавляем статистику одного матча (дом + гости) к накопленным итогам по игрокам.
export function mergeFinishedMatchIntoAggregate(
  aggregate: Record<number, PlayerMatchStats>,
  home: Record<number, PlayerMatchStats>,
  away: Record<number, PlayerMatchStats>,
): Record<number, PlayerMatchStats> {
  const next: Record<number, PlayerMatchStats> = { ...aggregate }

  const addSide = (side: Record<number, PlayerMatchStats>) => {
    for (const [idStr, st] of Object.entries(side)) {
      const id = Number(idStr)
      const prev = next[id] ?? { goals: 0, assists: 0, saves: 0, yellows: 0 }
      next[id] = {
        goals: prev.goals + st.goals,
        assists: prev.assists + st.assists,
        saves: prev.saves + st.saves,
        yellows: prev.yellows + st.yellows,
      }
    }
  }

  addSide(home)
  addSide(away)
  return next
}

// Вычитаем статистику удалённого матча из накопленных итогов — значения не уходят ниже 0.
export function subtractMatchFromAggregate(
  aggregate: Record<number, PlayerMatchStats>,
  home: Record<number, PlayerMatchStats>,
  away: Record<number, PlayerMatchStats>,
): Record<number, PlayerMatchStats> {
  const next: Record<number, PlayerMatchStats> = { ...aggregate }

  const subtractSide = (side: Record<number, PlayerMatchStats>) => {
    for (const [idStr, st] of Object.entries(side)) {
      const id = Number(idStr)
      const prev = next[id] ?? { goals: 0, assists: 0, saves: 0, yellows: 0 }
      next[id] = {
        goals: Math.max(0, prev.goals - st.goals),
        assists: Math.max(0, prev.assists - st.assists),
        saves: Math.max(0, prev.saves - st.saves),
        yellows: Math.max(0, prev.yellows - st.yellows),
      }
    }
  }

  subtractSide(home)
  subtractSide(away)
  return next
}
