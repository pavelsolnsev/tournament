import type { PlayerMatchStats } from './types'

function emptyPlayerMatchStats(): PlayerMatchStats {
  return { goals: 0, assists: 0, saves: 0, yellows: 0, reds: 0 }
}

/** Старые снимки без поля дают 0, а не NaN. */
function num(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function mergePlayerMatchStatsMax(a: PlayerMatchStats, b: PlayerMatchStats): PlayerMatchStats {
  return {
    goals: Math.max(num(a.goals), num(b.goals)),
    assists: Math.max(num(a.assists), num(b.assists)),
    saves: Math.max(num(a.saves), num(b.saves)),
    yellows: Math.max(num(a.yellows), num(b.yellows)),
    reds: Math.max(num(a.reds), num(b.reds)),
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
