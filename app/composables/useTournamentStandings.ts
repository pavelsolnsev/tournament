// Этот файл: главный composable для турнирной таблицы и матчей.
// Он собирает логику подбора пар, статистики событий и обновления standings для UI шага турнира.
import type { Player } from '~/types/tournament'
import type { SavedStandingsSnapshot } from '~/composables/useTournamentWizard'
import { useTeamColors } from '~/composables/useTeamColors'
import { usePlayerDisplay } from '~/composables/usePlayerDisplay'

import type {
  MarkedPlayer,
  PlayerMatchStats,
  PlayedMatch,
  Side,
  StatKey,
  TournamentStandingsParams,
} from './tournament-standings/types'

import { mergePlayerStatsRecords } from './tournament-standings/playerStatsMerge'
import { effectivePlayerStats, matchSideStats } from './tournament-standings/liveMatchStats'
import {
  buildStandingsSnapshot,
  createRemoteLiveSync,
  type StandingsSyncRefs,
} from './tournament-standings/remoteSync'
import type { ActiveSelection } from './tournament-standings/matchStats'
import type { PairingState } from './tournament-standings/pairing'
import type { StandingsRow } from '~/components/organisms/standings/Table.vue'
import { normalizeTeamColorsMap, normalizeTeamName, resolveTeamColorIndex } from '~/utils/teamNames'

import { extractMarkedPlayers } from './tournament-standings/events'
import { pickNextMatchPair, recalibratePairingState, resetMatchHistoryIfBalanced } from './tournament-standings/pairing'
import {
  isActivePlayer as isActivePlayerFn,
  incrementStat,
  onSelectAction as onSelectActionFn,
  playerStat as playerStatFn,
  resetMatchStats as resetMatchStatsFn,
  selectPlayerForMark as selectPlayerForMarkFn,
} from './tournament-standings/matchStats'
import { finishMatchAndRecord } from './tournament-standings/finishMatch'
import { recordTechnicalDefeat } from './tournament-standings/recordTechnicalDefeat'
import { resetTournamentMarksState } from './tournament-standings/resetMarks'
import { deletePlayedMatchFromList, updatePlayedMatchInList } from './tournament-standings/playedMatchEdit'

// Дополнительные параметры composable — начальный снапшот и callback для сохранения.
type StandingsOptions = {
  initialSnapshot?: SavedStandingsSnapshot | null
  onSnapshot?: (snapshot: SavedStandingsSnapshot) => void
}

export function useTournamentStandings(params: TournamentStandingsParams, options: StandingsOptions = {}) {
  const { teamMarkers, getMarkerByIndex } = useTeamColors()
  const { displayPlayerLabel, displayPlayerLabelWithoutRating } = usePlayerDisplay()

  // Цвета команд: ключи канонические; пропуски добиваем по порядку списка команд (как в мастере).
  const effectiveTeamColors = computed<Record<string, number>>(() => {
    const map = normalizeTeamColorsMap(params.teamColors)
    let next = 0
    for (const name of params.teams) {
      const nk = normalizeTeamName(name)
      if (!nk) continue
      if (map[nk] !== undefined) continue
      map[nk] = next % teamMarkers.length
      next += 1
    }
    return map
  })

  function teamMarker(teamName: string): string {
    const colorIndex = resolveTeamColorIndex(teamName, effectiveTeamColors.value, 0)
    return getMarkerByIndex(colorIndex)
  }

  // Глубокое клонирование снапшота — данные из API приходят как readonly прокси,
  // их нельзя мутировать напрямую. JSON round-trip создаёт чистые изменяемые объекты.
  const snap = options.initialSnapshot
    ? JSON.parse(JSON.stringify(options.initialSnapshot))
    : null

  // Таблица: восстанавливаем из снапшота или инициализируем с нуля.
  const standingsRows = ref<StandingsRow[]>(
    snap?.standingsRows?.length
      ? snap.standingsRows
      : params.teams.map((name, index) => ({
          place: index + 1,
          teamName: name,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDiff: 0,
          points: 0,
        })),
  )

  // История матчей и счётчики подбора следующей пары — восстанавливаем или начинаем заново.
  const matchCount = ref(snap?.matchCount ?? 0)
  const teamGamesCount = ref<Record<string, number>>(snap?.teamGamesCount ?? {})
  const consecutiveGames = ref<Record<string, number>>(snap?.consecutiveGames ?? {})
  const playedMatchesList = ref<PlayedMatch[]>(snap?.playedMatchesList ?? [])
  const matchHistory = ref<Record<string, Record<string, number>>>(snap?.matchHistory ?? {})
  const lastMatchIndex = ref<Record<string, Record<string, number>>>(snap?.lastMatchIndex ?? {})
  const playedSingleMatch = ref(snap?.playedSingleMatch ?? false)

  const pairingState: PairingState = {
    matchCount,
    teamGamesCount,
    consecutiveGames,
    matchHistory,
    lastMatchIndex,
    playedSingleMatch,
  }

  const playersById = computed<Record<number, Player>>(() => {
    const map: Record<number, Player> = {}
    for (const p of params.players) map[p.id] = p
    return map
  })

  function buildMarkedPlayers(statsRecord: Record<number, PlayerMatchStats>): MarkedPlayer[] {
    return extractMarkedPlayers({
      statsRecord,
      playersById: playersById.value,
      // В деталях матча рейтинг не показываем — только ник/имя.
      displayPlayerLabel: displayPlayerLabelWithoutRating,
    })
  }

  // Для N=2 после одного матча дальше не подбираем.
  const hasNextMatch = computed(() => {
    const teams = params.teams ?? []
    if (teams.length < 2) return false
    if (teams.length === 2) return !playedSingleMatch.value
    return true
  })

  // Восстанавливаем текущий матч из снапшота — чтобы админ мог вернуться к нему после выхода.
  const homeTeam = ref(snap?.currentHomeTeam ?? '')
  const awayTeam = ref(snap?.currentAwayTeam ?? '')
  const matchFinalized = ref(false)
  // Отметки текущего матча держим двумя картами: «добавили» и «сняли». Обе только растут,
  // поэтому объединяются между устройствами без потерь, а на экран и в протокол идёт разница.
  const homeAdded = ref<Record<number, PlayerMatchStats>>(
    snap?.currentHomeStatsAdded ?? snap?.currentHomeStats ?? {},
  )
  const awayAdded = ref<Record<number, PlayerMatchStats>>(
    snap?.currentAwayStatsAdded ?? snap?.currentAwayStats ?? {},
  )
  const homeRemoved = ref<Record<number, PlayerMatchStats>>(snap?.currentHomeStatsRemoved ?? {})
  const awayRemoved = ref<Record<number, PlayerMatchStats>>(snap?.currentAwayStatsRemoved ?? {})

  /** Команда игрока по составу турнира — по ней отсекаем отметки чужих. */
  const teamOfPlayer = (playerId: number) => params.assignmentByPlayerId[playerId] ?? ''

  // Страховка: даже если в счётчики попало что-то из другого матча, в счёт, протокол
  // и статистику это не уйдёт — игроки чужих команд отсекаются здесь, в одном месте.
  const homeStats = computed(() => matchSideStats(homeAdded.value, homeRemoved.value, homeTeam.value, teamOfPlayer))
  const awayStats = computed(() => matchSideStats(awayAdded.value, awayRemoved.value, awayTeam.value, teamOfPlayer))
  // Суммарные события по каждому игроку за все завершённые матчи — восстанавливаем из снапшота.
  // snap уже клонирован выше, поэтому объекты здесь изменяемые.
  const aggregatePlayerStats = ref<Record<number, PlayerMatchStats>>(snap?.aggregatePlayerStats ?? {})

  // Накопленные дельты рейтинга за все матчи турнира — восстанавливаем из снапшота.
  const playerRatingDeltas = ref<Record<number, number>>(snap?.playerRatingDeltas ?? {})

  // Версия истории матчей: растёт, когда матч завершили, удалили или поправили.
  // По ней устройства понимают, чья история новее, и не откатывают чужой сыгранный матч.
  // Запас для старых состояний без historyRev: число сыгранных матчей тоже растёт монотонно.
  const historyRev = ref<number>(
    Math.max(Number(snap?.historyRev) || 0, snap?.playedMatchesList?.length ?? 0),
  )
  function bumpHistoryRev() {
    historyRev.value = Math.max(historyRev.value + 1, playedMatchesList.value.length)
  }

  // Пока принимаем снапшот с другого устройства — не сбрасываем отметки при смене пары.
  const applyingRemoteSnapshot = ref(false)

  const homeGoals = computed(() => Object.values(homeStats.value).reduce((sum, s) => sum + s.goals, 0))
  const awayGoals = computed(() => Object.values(awayStats.value).reduce((sum, s) => sum + s.goals, 0))

  const canFinishMatch = computed(() => !!homeTeam.value && !!awayTeam.value && !matchFinalized.value)

  // Показ состава команд на экране.
  const playersByTeamMap = computed<Record<string, Player[]>>(() => {
    const map: Record<string, Player[]> = {}
    for (const p of params.players) {
      const teamName = params.assignmentByPlayerId[p.id]
      if (!teamName) continue
      if (!map[teamName]) map[teamName] = []
      map[teamName].push(p)
    }
    return map
  })

  function playersByTeam(teamName: string): Player[] {
    return playersByTeamMap.value[teamName] ?? []
  }

  // Активный игрок (кликнули в списке — ниже показываем select событий).
  const activeSelection = ref<ActiveSelection>(null)

  // Пара сменилась — матч другой, отметки прошлого к нему не относятся. Правило без исключений:
  // раньше первый после монтирования выбор пары пропускался, и отметки переезжали в новый матч.
  watch([homeTeam, awayTeam], (next, prev) => {
    // Пару сменила синхронизация с другим устройством — отметки пришли вместе с ней, не сбрасываем.
    if (applyingRemoteSnapshot.value) return
    if (next[0] === prev[0] && next[1] === prev[1]) return
    resetMatchStats()
    // Пару выбрали здесь — это ход турнира, второе устройство должно его увидеть.
    bumpHistoryRev()
  })

  function selectPlayerForMark(side: Side, playerId: number) {
    // Открываем/закрываем активного игрока для добавления событий.
    selectPlayerForMarkFn(activeSelection, side, playerId)
  }

  function isActivePlayer(side: Side, playerId: number) {
    return isActivePlayerFn(activeSelection, side, playerId)
  }

  function playerStat(side: Side, playerId: number) {
    // Заводим игрока в карте «добавили»: её ключи — состав матча, по нему считаются дельты рейтинга.
    playerStatFn(side, playerId, homeAdded, awayAdded)
    const added = side === 'home' ? homeAdded.value : awayAdded.value
    const removed = side === 'home' ? homeRemoved.value : awayRemoved.value
    return effectivePlayerStats(added, removed, playerId)
  }

  function onSelectAction(side: Side, playerId: number, evt: Event) {
    // Добавляет событие игроку и очищает select.
    onSelectActionFn(side, playerId, evt, homeAdded, awayAdded)
  }

  function addPlayerEvent(side: Side, playerId: number, key: StatKey) {
    incrementStat(side, playerId, key, homeAdded, awayAdded)
  }

  function removePlayerEvent(side: Side, playerId: number, key: StatKey) {
    // Снять можно только то, что реально отмечено. Пишем в карту «сняли»:
    // уменьшать «добавили» нельзя — правку затрёт слияние с другим устройством.
    const current = side === 'home' ? homeStats.value : awayStats.value
    if ((current[playerId]?.[key] ?? 0) <= 0) return
    incrementStat(side, playerId, key, homeRemoved, awayRemoved)
  }

  function resetMatchStats() {
    resetMatchStatsFn(homeAdded, awayAdded, activeSelection, matchFinalized)
    homeRemoved.value = {}
    awayRemoved.value = {}
  }

  function resetTournamentMarks() {
    resetTournamentMarksState(
      { teams: params.teams },
      standingsRows,
      matchCount,
      teamGamesCount,
      consecutiveGames,
      matchHistory,
      lastMatchIndex,
      playedSingleMatch,
      playedMatchesList,
      aggregatePlayerStats,
      playerRatingDeltas,
      resetMatchStats,
      homeTeam,
      awayTeam,
    )
    bumpHistoryRev()
  }

  function finishMatch() {
    finishMatchAndRecord({
      homeTeam,
      awayTeam,
      matchFinalized,
      homeGoals,
      awayGoals,
      homeStats,
      awayStats,
      standingsRows,
      playedMatchesList,
      aggregatePlayerStats,
      playerRatingDeltas,
      pairingState,
      teams: params.teams,
      playersById,
      buildMarkedPlayers,
      resetMatchStats,
    })
    bumpHistoryRev()
  }

  function updatePlayedMatch(
    matchNumber: number,
    newHomeGoals: number,
    newAwayGoals: number,
    newHomeStats: Record<number, PlayerMatchStats>,
    newAwayStats: Record<number, PlayerMatchStats>,
  ) {
    updatePlayedMatchInList({
      matchNumber,
      newHomeGoals,
      newAwayGoals,
      newHomeStats,
      newAwayStats,
      playedMatchesList,
      standingsRows,
      aggregatePlayerStats,
      playerRatingDeltas,
      playersById,
      displayPlayerLabelWithoutRating,
    })
    bumpHistoryRev()
  }

  function deletePlayedMatch(matchNumber: number) {
    deletePlayedMatchFromList({
      matchNumber,
      playedMatchesList,
      standingsRows,
      aggregatePlayerStats,
      playerRatingDeltas,
      pairingState,
      teams: params.teams,
      playersById,
    })
    bumpHistoryRev()
  }

  /**
   * Подмешивает отметки с сервера в текущий матч, если пара команд совпадает.
   * Нужно при работе с двух устройств: иначе «Следующий матч» финализирует только локальные отметки.
   */
  function mergeCurrentMatchFromRemoteSnapshot(remote: SavedStandingsSnapshot | null | undefined) {
    if (!remote) return
    const rh = normalizeTeamName(remote.currentHomeTeam ?? '')
    const ra = normalizeTeamName(remote.currentAwayTeam ?? '')
    const lh = normalizeTeamName(homeTeam.value)
    const la = normalizeTeamName(awayTeam.value)
    if (!rh || !ra || !lh || !la) return
    if (rh !== lh || ra !== la) return
    // Своё и чужое по максимуму — отдельно добавленное и снятое, чтобы не потерять ни отметку, ни правку.
    homeAdded.value = mergePlayerStatsRecords(homeAdded.value, remote.currentHomeStatsAdded ?? remote.currentHomeStats ?? {})
    awayAdded.value = mergePlayerStatsRecords(awayAdded.value, remote.currentAwayStatsAdded ?? remote.currentAwayStats ?? {})
    homeRemoved.value = mergePlayerStatsRecords(homeRemoved.value, remote.currentHomeStatsRemoved ?? {})
    awayRemoved.value = mergePlayerStatsRecords(awayRemoved.value, remote.currentAwayStatsRemoved ?? {})
  }

  // Refs, которые может обновить снапшот с другого устройства (поллинг во время матча).
  const syncRefs: StandingsSyncRefs = {
    standingsRows,
    playedMatchesList,
    aggregatePlayerStats,
    playerRatingDeltas,
    matchCount,
    teamGamesCount,
    consecutiveGames,
    matchHistory,
    lastMatchIndex,
    playedSingleMatch,
    homeTeam,
    awayTeam,
    homeAdded,
    awayAdded,
    homeRemoved,
    awayRemoved,
    homeStatsEffective: homeStats,
    awayStatsEffective: awayStats,
    matchFinalized,
    historyRev,
  }

  /** Живая синхронизация с БД: судья и админ видят один и тот же матч и одну и ту же таблицу. */
  const applyRemoteLiveSnapshot = createRemoteLiveSync(syncRefs, applyingRemoteSnapshot)

  // Подбор следующей пары после записи матча — общий шаг для «Следующий матч» и «Техническое».
  function advanceToNextPair() {
    if (!hasNextMatch.value) return

    // Пересинхронизируем все счётчики по реальным данным матчей перед подбором пары.
    // Это исправляет сбой логики если: матчи начинали вручную, или удаляли сыгранные.
    // После recalibrate pickNextMatchPair всегда работает от актуального состояния.
    recalibratePairingState(
      pairingState,
      params.teams,
      playedMatchesList.value.map((m) => ({
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        matchNumber: m.matchNumber,
      })),
    )
    resetMatchHistoryIfBalanced(pairingState, params.teams)

    const next = pickNextMatchPair(pairingState, params.teams)
    if (!next) return

    homeTeam.value = next.home
    awayTeam.value = next.away
    resetMatchStats()
  }

  function goToNextMatch() {
    // Если текущий матч не финализировали, можно сделать это автоматически.
    if (homeTeam.value && awayTeam.value && !matchFinalized.value) finishMatch()
    advanceToNextPair()
  }

  // Техническое поражение 3:0 выбранной команде из текущей пары; результат идёт в таблицу,
  // игрокам ничего не начисляется. После записи — переход к следующей паре, как в goToNextMatch.
  function applyTechnicalDefeat(losingTeam: string) {
    if (!homeTeam.value || !awayTeam.value) return
    recordTechnicalDefeat({
      homeTeam,
      awayTeam,
      losingTeam,
      standingsRows,
      playedMatchesList,
      pairingState,
      teams: params.teams,
      resetMatchStats,
    })
    bumpHistoryRev()
    advanceToNextPair()
  }

  // Когда список матчей или таблица меняются — вызываем callback для сохранения в куку.
  // Это позволяет восстановить состояние после перезагрузки страницы.
  watch(
    // Сохраняем и незавершённый матч тоже — команды и их текущую статистику.
    [
      playedMatchesList,
      standingsRows,
      aggregatePlayerStats,
      playerRatingDeltas,
      homeTeam,
      awayTeam,
      homeAdded,
      awayAdded,
      homeRemoved,
      awayRemoved,
    ],
    () => {
      if (!options.onSnapshot) return
      // Дельты рейтинга и текущий матч тоже в снапшоте — чтобы вернуться в него после перезагрузки.
      options.onSnapshot(buildStandingsSnapshot(syncRefs))
    },
    { deep: true },
  )

  return {
    teamMarkers,
    effectiveTeamColors,
    teamMarker,
    standingsRows,
    playedMatchesList,
    hasNextMatch,
    homeTeam,
    awayTeam,
    homeStats,
    awayStats,
    homeGoals,
    awayGoals,
    canFinishMatch,
    playersByTeam,
    activeSelection,
    selectPlayerForMark,
    isActivePlayer,
    playerStat,
    onSelectAction,
    addPlayerEvent,
    removePlayerEvent,
    updatePlayedMatch,
    deletePlayedMatch,
    resetMatchStats,
    resetTournamentMarks,
    finishMatch,
    goToNextMatch,
    applyTechnicalDefeat,
    mergeCurrentMatchFromRemoteSnapshot,
    applyRemoteLiveSnapshot,
    // Полная подпись с рейтингом — для ростеров и выбора игроков во время матча.
    displayPlayerLabel,
    aggregatePlayerStats,
    // Дельты рейтинга за турнир — нужны для UI в StepStandingsTeamRosterTotals.
    playerRatingDeltas,
  }
}

