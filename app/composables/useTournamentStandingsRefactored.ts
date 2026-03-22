// Этот файл: главный composable для турнирной таблицы и матчей.
// Он собирает логику подбора пар, статистики событий и обновления standings для UI шага турнира.
import type { Player } from '~/types/tournament'
import { useTeamColors } from '~/composables/useTeamColors'
import { usePlayerDisplay } from '~/composables/usePlayerDisplay'

import type {
  MarkedPlayer,
  PlayerMatchStats,
  PlayedMatch,
  Side,
  TournamentStandingsParams,
} from './tournament-standings/types'
import type { ActiveSelection } from './tournament-standings/matchStats'
import type { PairingState } from './tournament-standings/pairing'
import type { StandingsRow } from '~/components/organisms/standings/Table.vue'

import { extractMarkedPlayers } from './tournament-standings/events'
import { pickNextMatchPair, recordFinishedMatch, resetMatchHistoryIfBalanced } from './tournament-standings/pairing'
import { resortStandings, updateStandingsForTeam } from './tournament-standings/standings'
import {
  isActivePlayer as isActivePlayerFn,
  onSelectAction as onSelectActionFn,
  playerStat as playerStatFn,
  resetMatchStats as resetMatchStatsFn,
  selectPlayerForMark as selectPlayerForMarkFn,
} from './tournament-standings/matchStats'
import { mergeFinishedMatchIntoAggregate } from './tournament-standings/aggregateTournamentPlayerStats'

export function useTournamentStandingsRefactored(params: TournamentStandingsParams) {
  const { teamMarkers, getMarkerByIndex } = useTeamColors()
  const { displayPlayerLabel } = usePlayerDisplay()

  // Цвета команд: если какого-то цвета нет, добавляем его по кругу.
  const effectiveTeamColors = computed<Record<string, number>>(() => {
    const map: Record<string, number> = { ...params.teamColors }
    let next = 0
    for (const name of params.teams) {
      if (map[name] === undefined) {
        map[name] = next % teamMarkers.length
        next += 1
      }
    }
    return map
  })

  function teamMarker(teamName: string): string {
    const colorIndex = effectiveTeamColors.value[teamName] ?? 0
    return getMarkerByIndex(colorIndex)
  }

  // Таблица: места и очки.
  const standingsRows = ref<StandingsRow[]>(
    params.teams.map((name, index) => ({
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

  // История матчей и счётчики подбора следующей пары.
  const matchCount = ref(0)
  const teamGamesCount = ref<Record<string, number>>({})
  const consecutiveGames = ref<Record<string, number>>({})
  const playedMatchesList = ref<PlayedMatch[]>([])
  const matchHistory = ref<Record<string, Record<string, number>>>({})
  const lastMatchIndex = ref<Record<string, Record<string, number>>>({})
  const playedSingleMatch = ref(false)

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
      displayPlayerLabel,
    })
  }

  // Для N=2 после одного матча дальше не подбираем.
  const hasNextMatch = computed(() => {
    const teams = params.teams ?? []
    if (teams.length < 2) return false
    if (teams.length === 2) return !playedSingleMatch.value
    return true
  })

  const homeTeam = ref('')
  const awayTeam = ref('')
  const matchFinalized = ref(false)
  const homeStats = ref<Record<number, PlayerMatchStats>>({})
  const awayStats = ref<Record<number, PlayerMatchStats>>({})
  // Суммарные события по каждому игроку за все завершённые матчи (для блока под таблицей).
  const aggregatePlayerStats = ref<Record<number, PlayerMatchStats>>({})

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

  function resetMatchStats() {
    resetMatchStatsFn(homeStats, awayStats, activeSelection, matchFinalized)
  }

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

    resortStandings(standingsRows)

    // Записываем матч в историю для отображения UI.
    playedMatchesList.value.push({
      matchNumber,
      homeTeam: homeTeam.value,
      awayTeam: awayTeam.value,
      homeGoals: hg,
      awayGoals: ag,
      homePlayers,
      awayPlayers,
    })

    aggregatePlayerStats.value = mergeFinishedMatchIntoAggregate(
      aggregatePlayerStats.value,
      homeStats.value,
      awayStats.value,
    )

    // Сбрасываем то, что относится только к текущему "управлению" матчем:
    // 1) обнуляем результат и статистику игроков;
    // 2) очищаем выбранные команды, чтобы показывался плейсхолдер "— Выберите команду —".
    resetMatchStats()
    homeTeam.value = ''
    awayTeam.value = ''
  }

  function goToNextMatch() {
    // Если текущий матч не финализировали, можно сделать это автоматически.
    if (homeTeam.value && awayTeam.value && !matchFinalized.value) finishMatch()
    if (!hasNextMatch.value) return

    const next = pickNextMatchPair(pairingState, params.teams)
    if (!next) return

    homeTeam.value = next.home
    awayTeam.value = next.away
    resetMatchStats()
  }

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
    resetMatchStats,
    finishMatch,
    goToNextMatch,
    displayPlayerLabel,
    aggregatePlayerStats,
  }
}

