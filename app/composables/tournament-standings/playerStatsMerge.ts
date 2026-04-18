import type { PlayerMatchStats } from './types'

function emptyPlayerMatchStats(): PlayerMatchStats {
  return { goals: 0, assists: 0, saves: 0, yellows: 0 }
}

function mergePlayerMatchStatsMax(a: PlayerMatchStats, b: PlayerMatchStats): PlayerMatchStats {
  return {
    goals: Math.max(a.goals, b.goals),
    assists: Math.max(a.assists, b.assists),
    saves: Math.max(a.saves, b.saves),
    yellows: Math.max(a.yellows, b.yellows),
  }
}

/** Объединяет две карты статистики по игрокам: по каждому полю берём максимум (вклад с разных устройств). */
export function mergePlayerStatsRecords(
  local: Record<number, PlayerMatchStats>,
  remote: Record<number, PlayerMatchStats>,
): Record<number, PlayerMatchStats> {
  const ids = new Set<number>([
    ...Object.keys(local).map(Number),
    ...Object.keys(remote).map(Number),
  ])
  const out: Record<number, PlayerMatchStats> = {}
  for (const id of ids) {
    if (!Number.isFinite(id)) continue
    out[id] = mergePlayerMatchStatsMax(local[id] ?? emptyPlayerMatchStats(), remote[id] ?? emptyPlayerMatchStats())
  }
  return out
}
