import type { Player } from '~/types/tournament'
import type { StandingsRow } from '~/components/organisms/StandingsTable.vue'
import { useTeamColors } from '~/composables/useTeamColors'
import { usePlayerDisplay } from '~/composables/usePlayerDisplay'

type PlayerMatchStats = {
  goals: number
  assists: number
  saves: number
  yellows: number
}

type Side = 'home' | 'away'
type StatKey = keyof PlayerMatchStats

// Входные данные для логики турнира.
type Params = {
  teams: string[]
  teamColors: Record<string, number>
  players: Player[]
  assignmentByPlayerId: Record<number, string>
}

export function useTournamentStandings(params: Params) {
  const { teamMarkers, getMarkerByIndex } = useTeamColors()
  const { displayPlayerLabel } = usePlayerDisplay()

  const effectiveTeamColors = computed<Record<string, number>>(() => {
    // Берём цвета из params.teamColors и добавляем недостающие.
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

  const standingsRows = ref<StandingsRow[]>(params.teams.map((name, index) => ({
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
  })))

  // Счётчики для подбора следующего матча (как идея в executeKskCommand).
  const matchCount = ref(0) // сколько матчей уже было всего
  const teamGamesCount = ref<Record<string, number>>({}) // сколько матчей сыграла команда
  const consecutiveGames = ref<Record<string, number>>({}) // сколько матчей подряд команда играла

  // История пар для баланса.
  // matchHistory[a][b] = сколько раз команда a играла против b (после последнего "сброса круга").
  const matchHistory = ref<Record<string, Record<string, number>>>({})
  // lastMatchIndex[a][b] = номер матча, когда в последний раз a и b играли друг с другом.
  const lastMatchIndex = ref<Record<string, Record<string, number>>>({})

  // Для случая N=2: после одного матча дальше не подбираем.
  const playedSingleMatch = ref(false)

  function ensureTeam(teamName: string) {
    if (!teamName) return
    if (teamGamesCount.value[teamName] === undefined) teamGamesCount.value[teamName] = 0
    if (consecutiveGames.value[teamName] === undefined) consecutiveGames.value[teamName] = 0
  }

  function ensurePair(a: string, b: string) {
    if (!a || !b) return
    if (!matchHistory.value[a]) matchHistory.value[a] = {}
    if (!matchHistory.value[b]) matchHistory.value[b] = {}
    if (!lastMatchIndex.value[a]) lastMatchIndex.value[a] = {}
    if (!lastMatchIndex.value[b]) lastMatchIndex.value[b] = {}
  }

  function getTeamsRest(teamName: string): number {
    const games = teamGamesCount.value[teamName] ?? 0
    return matchCount.value - games
  }

  function allMatchups(): [string, string][] {
    const res: [string, string][] = []
    const list = params.teams ?? []
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        const a = list[i] ?? ''
        const b = list[j] ?? ''
        if (!a || !b) continue
        res.push([a, b])
      }
    }
    return res
  }

  function resetMatchHistoryIfBalanced() {
    const teams = params.teams ?? []
    if (teams.length < 3) return

    const matchups = allMatchups()
    if (matchups.length === 0) return

    let minMatchesPlayed = Infinity
    for (const [a, b] of matchups) {
      const count = matchHistory.value?.[a]?.[b] ?? 0
      minMatchesPlayed = Math.min(minMatchesPlayed, count)
    }

    const shouldReset = matchups.every(([a, b]) => (matchHistory.value?.[a]?.[b] ?? 0) >= minMatchesPlayed + 1)
    if (shouldReset) {
      matchHistory.value = {}
      lastMatchIndex.value = {}
    }
  }

  function pickNextMatchPair(): { home: string; away: string } | null {
    const teams = params.teams ?? []
    if (teams.length < 2) return null

    if (teams.length === 2) {
      if (playedSingleMatch.value) return null
      const home = teams[0]
      const away = teams[1]
      if (!home || !away) return null
      return { home, away }
    }

    const totalMatches = matchCount.value

    for (const t of teams) ensureTeam(t)

    const teamGamesCountValues = teams.map((t) => teamGamesCount.value[t] ?? 0)
    const teamRestCountValues = teamGamesCountValues.map((g) => totalMatches - g)

    const avgGames = teamGamesCountValues.length > 0
      ? teamGamesCountValues.reduce((sum, v) => sum + v, 0) / teamGamesCountValues.length
      : 0

    const avgRests = teamRestCountValues.length > 0
      ? teamRestCountValues.reduce((sum, v) => sum + v, 0) / teamRestCountValues.length
      : 0

    let bestScore = -Infinity
    let bestI = 0
    let bestJ = 1

    const matchups = allMatchups()
    for (const [a, b] of matchups) {
      const consecA = consecutiveGames.value[a] ?? 0
      const consecB = consecutiveGames.value[b] ?? 0
      if (consecA >= 2 || consecB >= 2) continue

      let score = 0

      // Чем дальше от последней встречи, тем лучше.
      const last = lastMatchIndex.value?.[a]?.[b]
      if (last !== undefined && last !== null) {
        const distanceFromLastMatch = totalMatches - last
        score += distanceFromLastMatch * 2000
      } else {
        score += 100000
      }

      // Пенальти за то, сколько раз эта пара уже играла (после последнего сброса).
      const gamesPlayed = matchHistory.value?.[a]?.[b] ?? 0
      score -= gamesPlayed * 100

      const iGames = teamGamesCount.value[a] ?? 0
      const jGames = teamGamesCount.value[b] ?? 0
      const iRests = totalMatches - iGames
      const jRests = totalMatches - jGames

      // Баланс: меньше игр и больше отдыхов - лучше.
      const iGamesDiff = avgGames - iGames
      const jGamesDiff = avgGames - jGames
      score += (iGamesDiff + jGamesDiff) * 50

      const iRestsDiff = iRests - avgRests
      const jRestsDiff = jRests - avgRests
      score += (iRestsDiff + jRestsDiff) * 50

      // Небольшой бонус, если команда отдыхала в прошлом матче.
      if (consecutiveGames.value[a] === 0 && iRests >= avgRests) score += 10
      if (consecutiveGames.value[b] === 0 && jRests >= avgRests) score += 10

      // Не даём одной команде сильно перегонять другую по количеству игр.
      const gamesDiff = Math.abs(iGames - jGames)
      score -= gamesDiff * 25

      if (score > bestScore) {
        bestScore = score
        bestI = teams.indexOf(a)
        bestJ = teams.indexOf(b)
      }
    }

    if (bestScore === -Infinity) return null
    const home = teams[bestI]
    const away = teams[bestJ]
    if (!home || !away) return null
    return { home, away }
  }

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

  const homeGoals = computed(() =>
    Object.values(homeStats.value).reduce((sum, s) => sum + s.goals, 0),
  )
  const awayGoals = computed(() =>
    Object.values(awayStats.value).reduce((sum, s) => sum + s.goals, 0),
  )

  const canFinishMatch = computed(() => !!homeTeam.value && !!awayTeam.value && !matchFinalized.value)

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

  const activeSelection = ref<{ side: Side; playerId: number } | null>(null)

  // Если пользователь вручную поменял команды, считаем текущий матч "не финализирован".
  // Статистику тоже очищаем.
  const isFirstWatchRun = ref(true)
  watch([homeTeam, awayTeam], (next, prev) => {
    if (isFirstWatchRun.value) {
      isFirstWatchRun.value = false
      return
    }
    if (next[0] !== prev[0] || next[1] !== prev[1]) {
      resetMatchStats()
    }
  })

  function selectPlayerForMark(side: Side, playerId: number) {
    if (
      activeSelection.value &&
      activeSelection.value.side === side &&
      activeSelection.value.playerId === playerId
    ) {
      activeSelection.value = null
    } else {
      activeSelection.value = { side, playerId }
    }
  }

  function isActivePlayer(side: Side, playerId: number) {
    return (
      !!activeSelection.value &&
      activeSelection.value.side === side &&
      activeSelection.value.playerId === playerId
    )
  }

  function ensureStats(container: Side, playerId: number): PlayerMatchStats {
    const target = container === 'home' ? homeStats.value : awayStats.value
    if (!target[playerId]) {
      target[playerId] = { goals: 0, assists: 0, saves: 0, yellows: 0 }
    }
    return target[playerId]
  }

  function playerStat(side: Side, playerId: number): PlayerMatchStats {
    return ensureStats(side, playerId)
  }

  function incrementStat(side: Side, playerId: number, key: StatKey) {
    const st = ensureStats(side, playerId)
    st[key] += 1
  }

  function onSelectAction(side: Side, playerId: number, evt: Event) {
    const select = evt.target as HTMLSelectElement
    const value = select.value as StatKey | ''
    if (!value) return
    incrementStat(side, playerId, value)
    select.value = ''
  }

  function resetMatchStats() {
    homeStats.value = {}
    awayStats.value = {}
    matchFinalized.value = false
    activeSelection.value = null
  }

  function updateStandingsForTeam(
    teamName: string,
    goalsFor: number,
    goalsAgainst: number,
  ) {
    const rows = standingsRows.value
    const row = rows.find((r) => r.teamName === teamName)
    if (!row) return

    row.played += 1
    row.goalsFor += goalsFor
    row.goalsAgainst += goalsAgainst

    if (goalsFor > goalsAgainst) {
      row.wins += 1
      row.points += 3
    } else if (goalsFor < goalsAgainst) {
      row.losses += 1
    } else {
      row.draws += 1
      row.points += 1
    }

    row.goalDiff = row.goalsFor - row.goalsAgainst
  }

  function resortStandings() {
    standingsRows.value = [...standingsRows.value]
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
        return a.teamName.localeCompare(b.teamName)
      })
      .map((row, index) => ({
        ...row,
        place: index + 1,
      }))
  }

  function finishMatch() {
    if (!homeTeam.value || !awayTeam.value) return
    if (matchFinalized.value) return

    const hg = homeGoals.value
    const ag = awayGoals.value

    updateStandingsForTeam(homeTeam.value, hg, ag)
    updateStandingsForTeam(awayTeam.value, ag, hg)

    // Обновляем состояние автоподбора пар.
    const home = homeTeam.value
    const away = awayTeam.value
    ensureTeam(home)
    ensureTeam(away)
    ensurePair(home, away)

    matchCount.value += 1

    teamGamesCount.value[home] = (teamGamesCount.value[home] ?? 0) + 1
    teamGamesCount.value[away] = (teamGamesCount.value[away] ?? 0) + 1

    consecutiveGames.value[home] = (consecutiveGames.value[home] ?? 0) + 1
    consecutiveGames.value[away] = (consecutiveGames.value[away] ?? 0) + 1

    // Остальные команды "отдыхали" в этот матч.
    for (const t of params.teams ?? []) {
      if (t !== home && t !== away) consecutiveGames.value[t] = 0
    }

    // Обновляем историю пары (симметрично).
    const mhHome = matchHistory.value[home] ?? {}
    const mhAway = matchHistory.value[away] ?? {}
    matchHistory.value[home] = mhHome
    matchHistory.value[away] = mhAway

    matchHistory.value[home][away] = (matchHistory.value[home][away] ?? 0) + 1
    matchHistory.value[away][home] = (matchHistory.value[away][home] ?? 0) + 1

    const lmiHome = lastMatchIndex.value[home] ?? {}
    const lmiAway = lastMatchIndex.value[away] ?? {}
    lastMatchIndex.value[home] = lmiHome
    lastMatchIndex.value[away] = lmiAway

    lastMatchIndex.value[home][away] = matchCount.value
    lastMatchIndex.value[away][home] = matchCount.value

    // Если команд всего 2 — дальше матчей нет.
    if ((params.teams ?? []).length === 2) {
      playedSingleMatch.value = true
    }

    resetMatchHistoryIfBalanced()

    resortStandings()
    matchFinalized.value = true
  }

  function goToNextMatch() {
    if (homeTeam.value && awayTeam.value && !matchFinalized.value) finishMatch()

    if (!hasNextMatch.value) return

    const next = pickNextMatchPair()
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
  }
}

