/**
 * При одновременных PUT с двух устройств (судья + админ) last-write-wins затирал отметки матча.
 * Подмешиваем накопленное в БД по тому же матчу: отдельно «добавили» и «сняли», по каждому
 * игроку и полю берём максимум (обе карты только растут), а итог считаем как их разницу.
 * Так не теряется ни чужая отметка, ни чужая правка — и минус больше не «воскресает».
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

/** Итог по игроку: добавленное минус снятое, не ниже нуля. */
function effectiveStatsRecord(
  added: Record<number, PlayerMatchStatsLoose>,
  removed: Record<number, PlayerMatchStatsLoose>,
): Record<number, PlayerMatchStatsLoose> {
  const out: Record<number, PlayerMatchStatsLoose> = {}
  const ids = new Set<number>([...Object.keys(added).map(Number), ...Object.keys(removed).map(Number)])
  for (const id of ids) {
    if (!Number.isFinite(id)) continue
    const a = added[id] ?? emptyStats()
    const r = removed[id] ?? emptyStats()
    out[id] = {
      goals: Math.max(0, a.goals - r.goals),
      assists: Math.max(0, a.assists - r.assists),
      saves: Math.max(0, a.saves - r.saves),
      yellows: Math.max(0, a.yellows - r.yellows),
    }
  }
  return out
}

/** Состав турнира: id игрока → команда. Нужен, чтобы отсечь отметки чужих игроков. */
function parseAssignment(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: Record<string, string> = {}
  for (const [id, team] of Object.entries(raw as Record<string, unknown>)) {
    const name = normalizeTeamName(team)
    if (name) out[String(id)] = name.toLowerCase()
  }
  return out
}

/**
 * Страховка от чужих отметок: игрок, записанный в другую команду, к этой стороне матча
 * не относится. Игроков без команды не трогаем — доказательств, что они чужие, нет.
 */
function onlyPlayersOfTeam(
  record: Record<number, PlayerMatchStatsLoose>,
  teamName: unknown,
  assignment: Record<string, string>,
): Record<number, PlayerMatchStatsLoose> {
  const side = normalizeTeamName(teamName).toLowerCase()
  if (!side) return record
  const out: Record<number, PlayerMatchStatsLoose> = {}
  for (const [id, stats] of Object.entries(record)) {
    const assigned = assignment[id]
    if (assigned && assigned !== side) continue
    out[Number(id)] = stats
  }
  return out
}

/** Сырые счётчики стороны: у старых состояний их нет — там итог и есть «добавили». */
function sideCounters(snapshot: Record<string, unknown>, side: 'Home' | 'Away') {
  const added = snapshot[`current${side}StatsAdded`] ?? snapshot[`current${side}Stats`]
  return {
    added: parsePlayerStatsMap(added),
    removed: parsePlayerStatsMap(snapshot[`current${side}StatsRemoved`]),
  }
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

  const assignment = parseAssignment(nextCtx.assignmentByPlayerId)

  for (const side of ['Home', 'Away'] as const) {
    const prevSide = sideCounters(p, side)
    const nextSide = sideCounters(n, side)
    const added = mergeStatsRecordsMax(prevSide.added, nextSide.added)
    const removed = mergeStatsRecordsMax(prevSide.removed, nextSide.removed)
    n[`current${side}StatsAdded`] = added
    n[`current${side}StatsRemoved`] = removed
    n[`current${side}Stats`] = onlyPlayersOfTeam(
      effectiveStatsRecord(added, removed),
      n[`current${side}Team`],
      assignment,
    )
  }
}
