// Отметки текущего матча хранятся двумя растущими картами: «добавили» и «сняли».
// Так правка судьи (минус) переживает синхронизацию: обе карты сливаются по максимуму,
// а на экран, в протокол матча и зрителю идёт их разница.
import type { PlayerMatchStats } from './types'

export function emptyPlayerMatchStats(): PlayerMatchStats {
  return { goals: 0, assists: 0, saves: 0, yellows: 0 }
}

function statOf(record: Record<number, PlayerMatchStats> | undefined, playerId: number): PlayerMatchStats {
  return record?.[playerId] ?? emptyPlayerMatchStats()
}

/** Итоговые отметки игрока: добавленное минус снятое, не ниже нуля. */
export function effectivePlayerStats(
  added: Record<number, PlayerMatchStats>,
  removed: Record<number, PlayerMatchStats>,
  playerId: number,
): PlayerMatchStats {
  const a = statOf(added, playerId)
  const r = statOf(removed, playerId)
  return {
    goals: Math.max(0, a.goals - r.goals),
    assists: Math.max(0, a.assists - r.assists),
    saves: Math.max(0, a.saves - r.saves),
    yellows: Math.max(0, a.yellows - r.yellows),
  }
}

/**
 * Итоговая карта отметок по всем игрокам матча.
 * Игроки с нулями остаются: список ключей — это состав матча, по нему считаются дельты рейтинга.
 */
export function effectiveStatsRecord(
  added: Record<number, PlayerMatchStats>,
  removed: Record<number, PlayerMatchStats>,
): Record<number, PlayerMatchStats> {
  const out: Record<number, PlayerMatchStats> = {}
  const ids = new Set<number>([
    ...Object.keys(added ?? {}).map(Number),
    ...Object.keys(removed ?? {}).map(Number),
  ])
  for (const id of ids) {
    if (!Number.isFinite(id)) continue
    out[id] = effectivePlayerStats(added ?? {}, removed ?? {}, id)
  }
  return out
}
