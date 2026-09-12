// Синхронизация экрана таблицы между устройствами (судья и админ ведут один матч).
// Состояние из БД приходит поллингом; здесь решаем, что с ним делать:
// ничего, подмешать отметки текущего матча или целиком принять чужой снапшот.
import type { Ref } from 'vue'
import { nextTick } from 'vue'
import type { MatchStatus } from '~/types/tournament'
import type { SavedStandingsSnapshot } from '~/composables/tournament-wizard/savedContextTypes'
import type { StandingsRow } from '~/components/organisms/standings/Table.vue'
import { normalizeTeamName } from '~/utils/teamNames'
import type { PlayedMatch, PlayerMatchStats } from './types'
import { mergePlayerStatsRecords } from './playerStatsMerge'

/** none — ничего не меняли; stats — подмешали отметки; adopt — приняли чужой снапшот целиком. */
export type RemoteSyncAction = 'none' | 'stats' | 'adopt'

/** Все refs таблицы, которые может обновить чужой снапшот. */
export type StandingsSyncRefs = {
  standingsRows: Ref<StandingsRow[]>
  playedMatchesList: Ref<PlayedMatch[]>
  aggregatePlayerStats: Ref<Record<number, PlayerMatchStats>>
  playerRatingDeltas: Ref<Record<number, number>>
  matchCount: Ref<number>
  teamGamesCount: Ref<Record<string, number>>
  consecutiveGames: Ref<Record<string, number>>
  matchHistory: Ref<Record<string, Record<string, number>>>
  lastMatchIndex: Ref<Record<string, Record<string, number>>>
  playedSingleMatch: Ref<boolean>
  homeTeam: Ref<string>
  awayTeam: Ref<string>
  /** Отметки текущего матча: отдельно добавленное и снятое — обе карты только растут. */
  homeAdded: Ref<Record<number, PlayerMatchStats>>
  awayAdded: Ref<Record<number, PlayerMatchStats>>
  homeRemoved: Ref<Record<number, PlayerMatchStats>>
  awayRemoved: Ref<Record<number, PlayerMatchStats>>
  /** Итоговые отметки для показа и протокола: разница карт минус игроки чужих команд. */
  homeStatsEffective: Ref<Record<number, PlayerMatchStats>>
  awayStatsEffective: Ref<Record<number, PlayerMatchStats>>
  matchFinalized: Ref<boolean>
  historyRev: Ref<number>
}

/** Статус матча с сервера — приходит рядом со снапшотом, из того же ответа. */
export type RemoteMatchState = {
  matchStatus?: MatchStatus | null
  liveHomeTeam?: string | null
  liveAwayTeam?: string | null
}

/**
 * Какой статус матча сообщить наверх после принятия чужого снапшота.
 * Главное — не «переоткрывать» матч, который на другом устройстве завершили ради показа итогов:
 * пара там уже пустая, и по одной паре мы бы решили, что матч просто не начат.
 */
export function matchStatusAfterAdopt(
  remote: RemoteMatchState | null | undefined,
  localHome: string,
  localAway: string,
): [MatchStatus, string, string] {
  if (remote?.matchStatus === 'finished') {
    return ['finished', String(remote.liveHomeTeam ?? ''), String(remote.liveAwayTeam ?? '')]
  }
  if (localHome && localAway) return ['live', localHome, localAway]
  return ['upcoming', '', '']
}

/** Версия истории матчей: растёт при завершении, удалении и правке сыгранного матча. */
export function historyRevOf(snapshot: SavedStandingsSnapshot | null | undefined): number {
  const n = Math.floor(Number(snapshot?.historyRev))
  return Number.isFinite(n) && n > 0 ? n : 0
}

/** Одна и та же пара команд (без учёта регистра и лишних пробелов), обе непустые. */
function isSamePair(localHome: string, localAway: string, remoteHome: unknown, remoteAway: unknown): boolean {
  const lh = normalizeTeamName(localHome)
  const la = normalizeTeamName(localAway)
  const rh = normalizeTeamName(String(remoteHome ?? ''))
  const ra = normalizeTeamName(String(remoteAway ?? ''))
  if (!lh || !la || !rh || !ra) return false
  return lh === rh && la === ra
}

/** Совпадают ли карты отметок по всем игрокам и полям (чтобы не дёргать сохранение вхолостую). */
function statsRecordsEqual(
  a: Record<number, PlayerMatchStats>,
  b: Record<number, PlayerMatchStats>,
): boolean {
  const ids = new Set<number>([...Object.keys(a).map(Number), ...Object.keys(b).map(Number)])
  for (const id of ids) {
    const x = a[id]
    const y = b[id]
    if (!x || !y) return false
    if (x.goals !== y.goals || x.assists !== y.assists || x.saves !== y.saves || x.yellows !== y.yellows) {
      return false
    }
  }
  return true
}

/**
 * Отметки текущего матча: свои и чужие по максимуму — отдельно добавленное и снятое.
 * Поэтому чужая отметка не теряется, а чужая правка (минус) доезжает и не «воскресает».
 */
function mergeCurrentStats(refs: StandingsSyncRefs, remote: SavedStandingsSnapshot) {
  const next = {
    homeAdded: mergePlayerStatsRecords(
      refs.homeAdded.value,
      remote.currentHomeStatsAdded ?? remote.currentHomeStats ?? {},
    ),
    awayAdded: mergePlayerStatsRecords(
      refs.awayAdded.value,
      remote.currentAwayStatsAdded ?? remote.currentAwayStats ?? {},
    ),
    homeRemoved: mergePlayerStatsRecords(refs.homeRemoved.value, remote.currentHomeStatsRemoved ?? {}),
    awayRemoved: mergePlayerStatsRecords(refs.awayRemoved.value, remote.currentAwayStatsRemoved ?? {}),
  }
  const changed =
    !statsRecordsEqual(refs.homeAdded.value, next.homeAdded)
    || !statsRecordsEqual(refs.awayAdded.value, next.awayAdded)
    || !statsRecordsEqual(refs.homeRemoved.value, next.homeRemoved)
    || !statsRecordsEqual(refs.awayRemoved.value, next.awayRemoved)
  return { ...next, changed }
}

/** Записать объединённые отметки в refs. */
function writeCurrentStats(refs: StandingsSyncRefs, merged: ReturnType<typeof mergeCurrentStats>) {
  refs.homeAdded.value = merged.homeAdded
  refs.awayAdded.value = merged.awayAdded
  refs.homeRemoved.value = merged.homeRemoved
  refs.awayRemoved.value = merged.awayRemoved
}

/** Принимаем чужую историю целиком: там завершили, удалили или поправили сыгранный матч. */
function adoptRemoteSnapshot(refs: StandingsSyncRefs, remote: SavedStandingsSnapshot, pairEqual: boolean) {
  // Данные из useFetch приходят readonly-прокси — клонируем, иначе их нельзя мутировать дальше.
  const next = JSON.parse(JSON.stringify(remote)) as SavedStandingsSnapshot

  refs.standingsRows.value = next.standingsRows ?? []
  refs.playedMatchesList.value = next.playedMatchesList ?? []
  refs.aggregatePlayerStats.value = next.aggregatePlayerStats ?? {}
  refs.playerRatingDeltas.value = next.playerRatingDeltas ?? {}
  refs.matchCount.value = next.matchCount ?? 0
  refs.teamGamesCount.value = next.teamGamesCount ?? {}
  refs.consecutiveGames.value = next.consecutiveGames ?? {}
  refs.matchHistory.value = next.matchHistory ?? {}
  refs.lastMatchIndex.value = next.lastMatchIndex ?? {}
  refs.playedSingleMatch.value = next.playedSingleMatch === true
  refs.historyRev.value = historyRevOf(next)

  if (pairEqual) {
    // Пара не менялась — свои свежие отметки сохраняем, чужие добавляем.
    writeCurrentStats(refs, mergeCurrentStats(refs, next))
    return
  }

  // На другом устройстве уже перешли к следующей паре — переключаемся вместе с ней.
  refs.homeTeam.value = next.currentHomeTeam ?? ''
  refs.awayTeam.value = next.currentAwayTeam ?? ''
  refs.homeAdded.value = next.currentHomeStatsAdded ?? next.currentHomeStats ?? {}
  refs.awayAdded.value = next.currentAwayStatsAdded ?? next.currentAwayStats ?? {}
  refs.homeRemoved.value = next.currentHomeStatsRemoved ?? {}
  refs.awayRemoved.value = next.currentAwayStatsRemoved ?? {}
  refs.matchFinalized.value = false
}

/** Собирает снапшот таблицы для сохранения в БД: итоговые отметки плюс сырые счётчики матча. */
export function buildStandingsSnapshot(refs: StandingsSyncRefs): SavedStandingsSnapshot {
  return {
    standingsRows: refs.standingsRows.value,
    playedMatchesList: refs.playedMatchesList.value,
    aggregatePlayerStats: refs.aggregatePlayerStats.value,
    matchCount: refs.matchCount.value,
    teamGamesCount: refs.teamGamesCount.value,
    consecutiveGames: refs.consecutiveGames.value,
    matchHistory: refs.matchHistory.value,
    lastMatchIndex: refs.lastMatchIndex.value,
    playedSingleMatch: refs.playedSingleMatch.value,
    playerRatingDeltas: refs.playerRatingDeltas.value,
    currentHomeTeam: refs.homeTeam.value,
    currentAwayTeam: refs.awayTeam.value,
    currentHomeStats: refs.homeStatsEffective.value,
    currentAwayStats: refs.awayStatsEffective.value,
    currentHomeStatsAdded: refs.homeAdded.value,
    currentHomeStatsRemoved: refs.homeRemoved.value,
    currentAwayStatsAdded: refs.awayAdded.value,
    currentAwayStatsRemoved: refs.awayRemoved.value,
    historyRev: refs.historyRev.value,
  }
}

/**
 * Обёртка для экрана таблицы: на время применения поднимаем флаг, чтобы watch по паре команд
 * не сбросил отметки, которые пришли вместе с новой парой.
 */
export function createRemoteLiveSync(refs: StandingsSyncRefs, applying: Ref<boolean>) {
  return (remote: SavedStandingsSnapshot | null | undefined): RemoteSyncAction => {
    applying.value = true
    try {
      return syncFromRemoteSnapshot(refs, remote)
    } finally {
      // Снимаем флаг после того, как watch отработает (он срабатывает до nextTick).
      void nextTick(() => {
        applying.value = false
      })
    }
  }
}

/**
 * Применяет снапшот из БД к локальному экрану таблицы.
 * Возвращает, что именно сделали — вызывающий по 'adopt' сообщает наверх новый статус матча.
 */
export function syncFromRemoteSnapshot(
  refs: StandingsSyncRefs,
  remote: SavedStandingsSnapshot | null | undefined,
): RemoteSyncAction {
  if (!remote) return 'none'

  const pairEqual = isSamePair(
    refs.homeTeam.value,
    refs.awayTeam.value,
    remote.currentHomeTeam,
    remote.currentAwayTeam,
  )

  // Чужая история новее — принимаем её, иначе своей отметкой затрём чужой сыгранный матч.
  if (historyRevOf(remote) > (Number(refs.historyRev.value) || 0)) {
    adoptRemoteSnapshot(refs, remote, pairEqual)
    return 'adopt'
  }

  // История та же: тянем только отметки текущего матча и только если пара совпала.
  if (!pairEqual) return 'none'
  const merged = mergeCurrentStats(refs, remote)
  if (!merged.changed) return 'none'
  writeCurrentStats(refs, merged)
  return 'stats'
}
