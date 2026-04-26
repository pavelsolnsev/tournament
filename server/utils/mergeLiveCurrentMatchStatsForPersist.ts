/**
 * При одновременных PUT с двух устройств (судья + админ) last-write-wins затирал
 * currentHomeStats/currentAwayStats. Подмешиваем к телу запроса накопленное в БД по тому же матчу:
 * по каждому игроку и полю берём максимум — как mergePlayerStatsRecords на клиенте.
 */

function normalizeTeamName(name: unknown): string {
  return String(name ?? '')
    .trim()
    .replace(/\s+/g, ' ')
}

export type PlayerMatchStatsLoose = {
  goals: number
  assists: number
  saves: number
  yellows: number
}

function emptyStats(): PlayerMatchStatsLoose {
  return { goals: 0, assists: 0, saves: 0, yellows: 0 }
}

function parsePlayerStatsMap(raw: unknown): Record<number, PlayerMatchStatsLoose> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<number, PlayerMatchStatsLoose> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const id = Number(k)
    if (!Number.isFinite(id)) continue
    if (!v || typeof v !== 'object') continue
    const o = v as Record<string, unknown>
    out[id] = {
      goals: Math.max(0, Number(o.goals) || 0),
      assists: Math.max(0, Number(o.assists) || 0),
      saves: Math.max(0, Number(o.saves) || 0),
      yellows: Math.max(0, Number(o.yellows) || 0),
    }
  }
  return out
}

function mergeStatsRecordsMax(
  a: Record<number, PlayerMatchStatsLoose>,
  b: Record<number, PlayerMatchStatsLoose>,
): Record<number, PlayerMatchStatsLoose> {
  const ids = new Set<number>([...Object.keys(a).map(Number), ...Object.keys(b).map(Number)])
  const out: Record<number, PlayerMatchStatsLoose> = {}
  for (const id of ids) {
    if (!Number.isFinite(id)) continue
    const x = a[id] ?? emptyStats()
    const y = b[id] ?? emptyStats()
    out[id] = {
      goals: Math.max(x.goals, y.goals),
      assists: Math.max(x.assists, y.assists),
      saves: Math.max(x.saves, y.saves),
      yellows: Math.max(x.yellows, y.yellows),
    }
  }
  return out
}

/**
 * Мутирует nextCtx.standingsSnapshot (если нужно), подмешивая счётчики из prevCtx для того же currentHome/currentAway.
 */
export function mergeLiveCurrentMatchStatsIntoNextState(
  prevCtx: Record<string, unknown>,
  nextCtx: Record<string, unknown>,
): void {
  const prevSnap = prevCtx.standingsSnapshot
  const nextSnap = nextCtx.standingsSnapshot
  if (!prevSnap || typeof prevSnap !== 'object' || prevSnap === null) return
  if (!nextSnap || typeof nextSnap !== 'object' || nextSnap === null) return

  const p = prevSnap as Record<string, unknown>
  const n = nextSnap as Record<string, unknown>

  const ph = normalizeTeamName(p.currentHomeTeam)
  const pa = normalizeTeamName(p.currentAwayTeam)
  const nh = normalizeTeamName(n.currentHomeTeam)
  const na = normalizeTeamName(n.currentAwayTeam)

  if (!ph || !pa || !nh || !na) return
  if (ph !== nh || pa !== na) return

  n.currentHomeStats = mergeStatsRecordsMax(parsePlayerStatsMap(p.currentHomeStats), parsePlayerStatsMap(n.currentHomeStats))
  n.currentAwayStats = mergeStatsRecordsMax(parsePlayerStatsMap(p.currentAwayStats), parsePlayerStatsMap(n.currentAwayStats))
}
