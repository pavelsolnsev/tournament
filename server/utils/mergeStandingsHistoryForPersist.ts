/**
 * Судья и админ ведут матч с двух устройств и шлют PUT со всем состоянием целиком.
 * Отставшее устройство (не успело подтянуть чужой завершённый матч) своим PUT откатывало
 * список сыгранных матчей и таблицу. Здесь сравниваем версию истории и не даём ей уехать назад.
 */

/** Поля снапшота, которые описывают уже сыгранное — их и защищаем. */
const HISTORY_KEYS = [
  'standingsRows',
  'playedMatchesList',
  'aggregatePlayerStats',
  'playerRatingDeltas',
  'matchCount',
  'teamGamesCount',
  'consecutiveGames',
  'matchHistory',
  'lastMatchIndex',
  'playedSingleMatch',
] as const

/**
 * Поля текущего (незавершённого) матча. Переносятся только вместе: и пара команд,
 * и итоговые отметки, и сырые счётчики «добавили/сняли» — именно они авторитетны
 * для клиента и для слияния. Оставить чужие счётчики рядом с чужой парой нельзя:
 * отметки прошлого матча приклеятся к следующему.
 */
const CURRENT_MATCH_KEYS = [
  'currentHomeTeam',
  'currentAwayTeam',
  'currentHomeStats',
  'currentAwayStats',
  'currentHomeStatsAdded',
  'currentHomeStatsRemoved',
  'currentAwayStatsAdded',
  'currentAwayStatsRemoved',
] as const

function asObject(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  return raw as Record<string, unknown>
}

function normalizeTeamName(name: unknown): string {
  return String(name ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
}

/**
 * Версия истории матчей. Клиент растит её при завершении/удалении/правке матча.
 * Запас на старые состояния без поля: число сыгранных матчей — тоже монотонная величина.
 */
export function standingsHistoryRev(snapshot: Record<string, unknown> | null): number {
  if (!snapshot) return 0
  const raw = Math.floor(Number(snapshot.historyRev))
  const rev = Number.isFinite(raw) && raw > 0 ? raw : 0
  const played = Array.isArray(snapshot.playedMatchesList) ? snapshot.playedMatchesList.length : 0
  return Math.max(rev, played)
}

/** Одна и та же пара текущего матча в двух снапшотах. */
function isSameCurrentPair(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const ah = normalizeTeamName(a.currentHomeTeam)
  const aa = normalizeTeamName(a.currentAwayTeam)
  const bh = normalizeTeamName(b.currentHomeTeam)
  const ba = normalizeTeamName(b.currentAwayTeam)
  if (!ah || !aa || !bh || !ba) return false
  return ah === bh && aa === ba
}

/**
 * Мутирует nextCtx: если пришедшее состояние отстало по истории матчей — возвращаем историю из БД.
 * Когда у отставшего устройства ещё и пара текущего матча старая, оставляем текущий матч из БД
 * (вместе со статусом матча в контексте), иначе уже сыгранный матч снова стал бы «идущим».
 */
export function mergeStandingsHistoryIntoNextState(
  prevCtx: Record<string, unknown>,
  nextCtx: Record<string, unknown>,
): void {
  const prevSnap = asObject(prevCtx.standingsSnapshot)
  const nextSnap = asObject(nextCtx.standingsSnapshot)
  if (!prevSnap || !nextSnap) return

  const prevRev = standingsHistoryRev(prevSnap)
  if (standingsHistoryRev(nextSnap) >= prevRev) return

  for (const key of HISTORY_KEYS) {
    nextSnap[key] = prevSnap[key]
  }
  nextSnap.historyRev = prevRev

  if (isSameCurrentPair(prevSnap, nextSnap)) return

  for (const key of CURRENT_MATCH_KEYS) {
    // Поля нет в БД (старое состояние) — убираем и у клиента, иначе его счётчики
    // от прошлого матча останутся в сохранённом состоянии.
    if (prevSnap[key] === undefined) {
      Reflect.deleteProperty(nextSnap, key)
      continue
    }
    nextSnap[key] = prevSnap[key]
  }
  nextCtx.matchStatus = prevCtx.matchStatus
  nextCtx.liveHomeTeam = prevCtx.liveHomeTeam
  nextCtx.liveAwayTeam = prevCtx.liveAwayTeam
}
