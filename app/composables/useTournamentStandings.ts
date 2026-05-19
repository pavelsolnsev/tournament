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
import type { ActiveSelection } from './tournament-standings/matchStats'
import type { PairingState } from './tournament-standings/pairing'
import type { StandingsRow } from '~/components/organisms/standings/Table.vue'
import { normalizeTeamColorsMap, normalizeTeamName, resolveTeamColorIndex } from '~/utils/teamNames'

import { extractMarkedPlayers } from './tournament-standings/events'
import { pickNextMatchPair, recalibratePairingState, resetMatchHistoryIfBalanced } from './tournament-standings/pairing'
import {
  isActivePlayer as isActivePlayerFn,
  incrementStat,
  decrementStat,
  onSelectAction as onSelectActionFn,
  playerStat as playerStatFn,
  resetMatchStats as resetMatchStatsFn,
  selectPlayerForMark as selectPlayerForMarkFn,
} from './tournament-standings/matchStats'
import { finishMatchAndRecord } from './tournament-standings/finishMatch'
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
  const homeStats = ref<Record<number, PlayerMatchStats>>(snap?.currentHomeStats ?? {})
  const awayStats = ref<Record<number, PlayerMatchStats>>(snap?.currentAwayStats ?? {})
  // Суммарные события по каждому игроку за все завершённые матчи — восстанавливаем из снапшота.
  // snap уже клонирован выше, поэтому объекты здесь изменяемые.
  const aggregatePlayerStats = ref<Record<number, PlayerMatchStats>>(snap?.aggregatePlayerStats ?? {})

  // Накопленные дельты рейтинга за все матчи турнира — восстанавливаем из снапшота.
  const playerRatingDeltas = ref<Record<number, number>>(snap?.playerRatingDeltas ?? {})

  // Монотонный счётчик локальных правок отметок: растёт при каждом add/remove.
  // Сохраняется в снапшот и сравнивается с remote при мёрже — если remote.seq <= local.seq,
  // значит серверный снапшот устарел (ещё не получил наши изменения из-за дебаунса PUT) и мёрж пропускается.
  const localStatsSeq = ref<number>(snap?.currentStatsSeq ?? 0)

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

  // Если пользователь вручную поменял команды — считаем матч "не финализирован" и очищаем статистику.
  const isFirstWatchRun = ref(true)
  watch([homeTeam, awayTeam], (next, prev) => {
    if (isFirstWatchRun.value) {
      isFirstWatchRun.value = false
      return
    }
    if (next[0] !== prev[0] || next[1] !== prev[1]) resetMatchStats()
  })

  function selectPlayerForMark(side: Side, playerId: number) {
    // Открываем/закрываем активного игрока для добавления событий.
    selectPlayerForMarkFn(activeSelection, side, playerId)
  }

  function isActivePlayer(side: Side, playerId: number) {
    return isActivePlayerFn(activeSelection, side, playerId)
  }

  function playerStat(side: Side, playerId: number) {
    return playerStatFn(side, playerId, homeStats, awayStats)
  }

  function onSelectAction(side: Side, playerId: number, evt: Event) {
    // Добавляет событие игроку и очищает select.
    onSelectActionFn(side, playerId, evt, homeStats, awayStats)
  }

  function addPlayerEvent(side: Side, playerId: number, key: StatKey) {
    localStatsSeq.value += 1
    incrementStat(side, playerId, key, homeStats, awayStats)
  }

  function removePlayerEvent(side: Side, playerId: number, key: StatKey) {
    localStatsSeq.value += 1
    decrementStat(side, playerId, key, homeStats, awayStats)
  }

  function resetMatchStats() {
    localStatsSeq.value = 0
    resetMatchStatsFn(homeStats, awayStats, activeSelection, matchFinalized)
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
    const remoteSeq = remote.currentStatsSeq ?? 0
    // Локальный seq новее или равен — серверный снапшот устарел (PUT ещё в дебаунсе).
    // Пропускаем мёрж, иначе Math.max восстановит отменённые локально отметки.
    if (remoteSeq <= localStatsSeq.value) return
    // Remote строго новее: берём remote-состояние напрямую (не Math.max).
    // Math.max(local=1, remote=0)=1 не даёт удалению распространиться;
    // прямое присваивание корректно передаёт и добавления, и отмены с другого устройства.
    homeStats.value = { ...(remote.currentHomeStats ?? {}) }
    awayStats.value = { ...(remote.currentAwayStats ?? {}) }
    localStatsSeq.value = remoteSeq
  }

  function goToNextMatch() {
    // Если текущий матч не финализировали, можно сделать это автоматически.
    if (homeTeam.value && awayTeam.value && !matchFinalized.value) finishMatch()
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

  // Когда список матчей или таблица меняются — вызываем callback для сохранения в куку.
  // Это позволяет восстановить состояние после перезагрузки страницы.
  watch(
    // Сохраняем и незавершённый матч тоже — команды и их текущую статистику.
    [playedMatchesList, standingsRows, aggregatePlayerStats, playerRatingDeltas, homeTeam, awayTeam, homeStats, awayStats],
    () => {
      if (!options.onSnapshot) return
      options.onSnapshot({
        standingsRows: standingsRows.value,
        playedMatchesList: playedMatchesList.value,
        aggregatePlayerStats: aggregatePlayerStats.value,
        matchCount: matchCount.value,
        teamGamesCount: teamGamesCount.value,
        consecutiveGames: consecutiveGames.value,
        matchHistory: matchHistory.value,
        lastMatchIndex: lastMatchIndex.value,
        playedSingleMatch: playedSingleMatch.value,
        // Сохраняем дельты рейтинга — чтобы UI не сбрасывался после перезагрузки.
        playerRatingDeltas: playerRatingDeltas.value,
        // Сохраняем текущий матч — чтобы вернуться в тот же матч после выхода из админки.
        currentHomeTeam: homeTeam.value,
        currentAwayTeam: awayTeam.value,
        currentHomeStats: homeStats.value,
        currentAwayStats: awayStats.value,
        currentStatsSeq: localStatsSeq.value,
      })
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
    mergeCurrentMatchFromRemoteSnapshot,
    // Полная подпись с рейтингом — для ростеров и выбора игроков во время матча.
    displayPlayerLabel,
    aggregatePlayerStats,
    // Дельты рейтинга за турнир — нужны для UI в StepStandingsTeamRosterTotals.
    playerRatingDeltas,
  }
}

