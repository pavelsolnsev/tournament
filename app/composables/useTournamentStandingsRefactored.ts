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
import { pickNextMatchPair, recordFinishedMatch, recalibratePairingState, resetMatchHistoryIfBalanced } from './tournament-standings/pairing'
import { resortStandings, updateStandingsForTeam } from './tournament-standings/standings'
import {
  isActivePlayer as isActivePlayerFn,
  incrementStat,
  decrementStat,
  onSelectAction as onSelectActionFn,
  playerStat as playerStatFn,
  resetMatchStats as resetMatchStatsFn,
  selectPlayerForMark as selectPlayerForMarkFn,
} from './tournament-standings/matchStats'
import { mergeFinishedMatchIntoAggregate, subtractMatchFromAggregate } from './tournament-standings/aggregateTournamentPlayerStats'
import { applyRatingDeltas, computeTeamRatingDeltas, revertRatingDeltas } from './tournament-standings/ratings'
import { subtractPlayedMatchFromStandingsRows } from './tournament-standings/subtractPlayedMatchFromStandingsRows'

// Дополнительные параметры composable — начальный снапшот и callback для сохранения.
type StandingsOptions = {
  initialSnapshot?: SavedStandingsSnapshot | null
  onSnapshot?: (snapshot: SavedStandingsSnapshot) => void
}

export function useTournamentStandingsRefactored(params: TournamentStandingsParams, options: StandingsOptions = {}) {
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
    // Прямой вызов без Event-хаков — для кастомных кнопок событий.
    incrementStat(side, playerId, key, homeStats, awayStats)
  }

  function removePlayerEvent(side: Side, playerId: number, key: StatKey) {
    // Отменяет последнее добавленное событие — нельзя уйти ниже нуля.
    decrementStat(side, playerId, key, homeStats, awayStats)
  }

  function resetMatchStats() {
    resetMatchStatsFn(homeStats, awayStats, activeSelection, matchFinalized)
  }

  function resetTournamentMarks() {
    // Simple10: Это "мягкий сброс" только результатов и отметок внутри текущего турнира.
    // Simple10: Игроков, команды и назначение по командам НЕ трогаем — только матчи/таблицу/дельты рейтинга/счётчики.

    // Simple10: Сбрасываем турнирную таблицу в ноль по текущему списку команд.
    standingsRows.value = params.teams.map((name, index) => ({
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
    }))

    // Simple10: Очищаем историю матчей и все счётчики подбора следующей пары.
    matchCount.value = 0
    teamGamesCount.value = {}
    consecutiveGames.value = {}
    matchHistory.value = {}
    lastMatchIndex.value = {}
    playedSingleMatch.value = false
    playedMatchesList.value = []

    // Simple10: Очищаем суммарную статистику игроков и накопленные дельты рейтинга за турнир.
    aggregatePlayerStats.value = {}
    playerRatingDeltas.value = {}

    // Simple10: Сбрасываем текущий матч (выбранные команды и текущие отметки).
    resetMatchStats()
    homeTeam.value = ''
    awayTeam.value = ''
  }

  // Рейтинг: функции вынесены в отдельный модуль, чтобы файл был меньше.
  const applyRating = (deltas: Record<number, number>) =>
    applyRatingDeltas({ playerRatingDeltas, deltas })
  const revertRating = (deltas: Record<number, number>) =>
    revertRatingDeltas({ playerRatingDeltas, deltas })

  function finishMatch() {
    if (!homeTeam.value || !awayTeam.value) return
    if (matchFinalized.value) return

    const hg = homeGoals.value
    const ag = awayGoals.value

    // Обновляем таблицу (очки/голы) для обеих команд.
    updateStandingsForTeam(standingsRows, homeTeam.value, hg, ag)
    updateStandingsForTeam(standingsRows, awayTeam.value, ag, hg)

    // Считаем пометки по игрокам (какие события были).
    const homePlayers = buildMarkedPlayers(homeStats.value)
    const awayPlayers = buildMarkedPlayers(awayStats.value)

    // Записываем результат матча в историю автоподбора пар.
    const matchNumber = recordFinishedMatch(pairingState, homeTeam.value, awayTeam.value, params.teams)
    resetMatchHistoryIfBalanced(pairingState, params.teams)

    // Сначала в список сыгранных — сортировка с личками смотрит только завершённые матчи.
    playedMatchesList.value.push({
      matchNumber,
      homeTeam: homeTeam.value,
      awayTeam: awayTeam.value,
      homeGoals: hg,
      awayGoals: ag,
      homePlayers,
      awayPlayers,
      homeStats: { ...homeStats.value },
      awayStats: { ...awayStats.value },
    })

    resortStandings(standingsRows, playedMatchesList.value)

    aggregatePlayerStats.value = mergeFinishedMatchIntoAggregate(
      aggregatePlayerStats.value,
      homeStats.value,
      awayStats.value,
    )

    // Считаем дельты рейтинга для обеих команд и сохраняем в БД.
    const isHomeDraw = hg === ag
    const isHomeWin = hg > ag
    const homeDeltas = computeTeamRatingDeltas({
      playersById: playersById.value,
      statsRecord: homeStats.value,
      isWin: isHomeWin,
      isDraw: isHomeDraw,
      isLose: !isHomeWin && !isHomeDraw,
      teamGoals: hg,
      opponentGoals: ag,
    })
    const awayDeltas = computeTeamRatingDeltas({
      playersById: playersById.value,
      statsRecord: awayStats.value,
      isWin: !isHomeWin && !isHomeDraw,
      isDraw: isHomeDraw,
      isLose: isHomeWin,
      teamGoals: ag,
      opponentGoals: hg,
    })
    // Накапливаем дельты рейтинга в памяти — в БД запишем только при завершении турнира.
    applyRating({ ...homeDeltas, ...awayDeltas })

    // Сбрасываем то, что относится только к текущему "управлению" матчем:
    // 1) обнуляем результат и статистику игроков;
    // 2) очищаем выбранные команды, чтобы показывался плейсхолдер "— Выберите команду —".
    resetMatchStats()
    homeTeam.value = ''
    awayTeam.value = ''
  }

  function updatePlayedMatch(
    matchNumber: number,
    newHomeGoals: number,
    newAwayGoals: number,
    newHomeStats: Record<number, PlayerMatchStats>,
    newAwayStats: Record<number, PlayerMatchStats>,
  ) {
    const idx = playedMatchesList.value.findIndex((m) => m.matchNumber === matchNumber)
    if (idx === -1) return

    const old = playedMatchesList.value[idx]
    if (!old) return

    subtractPlayedMatchFromStandingsRows(standingsRows.value, old)

    // Применяем новый результат в таблицу.
    updateStandingsForTeam(standingsRows, old.homeTeam, newHomeGoals, newAwayGoals)
    updateStandingsForTeam(standingsRows, old.awayTeam, newAwayGoals, newHomeGoals)

    // Пересчитываем подписи игроков из новой статистики.
    const newHomePlayers = extractMarkedPlayers({
      statsRecord: newHomeStats,
      playersById: playersById.value,
      displayPlayerLabel: displayPlayerLabelWithoutRating,
    })
    const newAwayPlayers = extractMarkedPlayers({
      statsRecord: newAwayStats,
      playersById: playersById.value,
      displayPlayerLabel: displayPlayerLabelWithoutRating,
    })

    // Обновляем запись матча в истории.
    playedMatchesList.value[idx] = {
      ...old,
      homeGoals: newHomeGoals,
      awayGoals: newAwayGoals,
      homeStats: { ...newHomeStats },
      awayStats: { ...newAwayStats },
      homePlayers: newHomePlayers,
      awayPlayers: newAwayPlayers,
    }

    resortStandings(standingsRows, playedMatchesList.value)

    // Обновляем агрегатную статистику игроков: вычитаем старый матч, добавляем новый.
    aggregatePlayerStats.value = subtractMatchFromAggregate(
      aggregatePlayerStats.value,
      old.homeStats,
      old.awayStats,
    )
    aggregatePlayerStats.value = mergeFinishedMatchIntoAggregate(
      aggregatePlayerStats.value,
      newHomeStats,
      newAwayStats,
    )

    // Откатываем рейтинг старого матча и применяем новый.
    const oldIsHomeDraw = old.homeGoals === old.awayGoals
    const oldIsHomeWin = old.homeGoals > old.awayGoals
    const oldHomeDeltas = computeTeamRatingDeltas({
      playersById: playersById.value,
      statsRecord: old.homeStats,
      isWin: oldIsHomeWin,
      isDraw: oldIsHomeDraw,
      isLose: !oldIsHomeWin && !oldIsHomeDraw,
      teamGoals: old.homeGoals,
      opponentGoals: old.awayGoals,
    })
    const oldAwayDeltas = computeTeamRatingDeltas({
      playersById: playersById.value,
      statsRecord: old.awayStats,
      isWin: !oldIsHomeWin && !oldIsHomeDraw,
      isDraw: oldIsHomeDraw,
      isLose: oldIsHomeWin,
      teamGoals: old.awayGoals,
      opponentGoals: old.homeGoals,
    })
    const newIsHomeDraw = newHomeGoals === newAwayGoals
    const newIsHomeWin = newHomeGoals > newAwayGoals
    const newHomeDeltas = computeTeamRatingDeltas({
      playersById: playersById.value,
      statsRecord: newHomeStats,
      isWin: newIsHomeWin,
      isDraw: newIsHomeDraw,
      isLose: !newIsHomeWin && !newIsHomeDraw,
      teamGoals: newHomeGoals,
      opponentGoals: newAwayGoals,
    })
    const newAwayDeltas = computeTeamRatingDeltas({
      playersById: playersById.value,
      statsRecord: newAwayStats,
      isWin: !newIsHomeWin && !newIsHomeDraw,
      isDraw: newIsHomeDraw,
      isLose: newIsHomeWin,
      teamGoals: newAwayGoals,
      opponentGoals: newHomeGoals,
    })
    revertRating({ ...oldHomeDeltas, ...oldAwayDeltas })
    applyRating({ ...newHomeDeltas, ...newAwayDeltas })
  }

  function deletePlayedMatch(matchNumber: number) {
    const idx = playedMatchesList.value.findIndex((m) => m.matchNumber === matchNumber)
    if (idx === -1) return

    const old = playedMatchesList.value[idx]
    if (!old) return

    subtractPlayedMatchFromStandingsRows(standingsRows.value, old)

    // Убираем матч из списка.
    playedMatchesList.value.splice(idx, 1)

    // Переиндексируем оставшиеся матчи: убираем "дырки" в нумерации.
    // Это нужно чтобы matchNumber в UI шёл подряд (1, 2, 3...) и lastMatchIndex
    // в pairingState ссылался на актуальные номера после пересчёта.
    playedMatchesList.value.forEach((m, i) => {
      m.matchNumber = i + 1
    })

    resortStandings(standingsRows, playedMatchesList.value)

    // Пересчитываем aggregate-статистику игроков без этого матча.
    aggregatePlayerStats.value = subtractMatchFromAggregate(
      aggregatePlayerStats.value,
      old.homeStats,
      old.awayStats,
    )

    // Откатываем рейтинг удалённого матча в БД и в локальных дельтах.
    const delIsHomeDraw = old.homeGoals === old.awayGoals
    const delIsHomeWin = old.homeGoals > old.awayGoals
    const delHomeDeltas = computeTeamRatingDeltas({
      playersById: playersById.value,
      statsRecord: old.homeStats,
      isWin: delIsHomeWin,
      isDraw: delIsHomeDraw,
      isLose: !delIsHomeWin && !delIsHomeDraw,
      teamGoals: old.homeGoals,
      opponentGoals: old.awayGoals,
    })
    const delAwayDeltas = computeTeamRatingDeltas({
      playersById: playersById.value,
      statsRecord: old.awayStats,
      isWin: !delIsHomeWin && !delIsHomeDraw,
      isDraw: delIsHomeDraw,
      isLose: delIsHomeWin,
      teamGoals: old.awayGoals,
      opponentGoals: old.homeGoals,
    })
    revertRating({ ...delHomeDeltas, ...delAwayDeltas })

    // Полностью пересинхронизируем pairingState по переиндексированному списку.
    // recalibrate надёжнее unrecord: пересчитывает всё с нуля, не зависит от порядка удалений.
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
    homeStats.value = mergePlayerStatsRecords(homeStats.value, remote.currentHomeStats ?? {})
    awayStats.value = mergePlayerStatsRecords(awayStats.value, remote.currentAwayStats ?? {})
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

