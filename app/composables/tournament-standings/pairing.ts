// Этот файл: логика подбора следующего матча и ведения истории пар.
// Он нужен, чтобы турнирная система выбирала пары команд более “равномерно”.
import type { Ref } from 'vue'

export type PairingState = {
  matchCount: Ref<number>
  teamGamesCount: Ref<Record<string, number>>
  consecutiveGames: Ref<Record<string, number>>
  matchHistory: Ref<Record<string, Record<string, number>>>
  lastMatchIndex: Ref<Record<string, Record<string, number>>>
  playedSingleMatch: Ref<boolean>
}

function ensureTeam(state: PairingState, teamName: string) {
  if (!teamName) return
  if (state.teamGamesCount.value[teamName] === undefined) state.teamGamesCount.value[teamName] = 0
  if (state.consecutiveGames.value[teamName] === undefined) state.consecutiveGames.value[teamName] = 0
}

function ensurePair(state: PairingState, a: string, b: string) {
  if (!a || !b) return
  if (!state.matchHistory.value[a]) state.matchHistory.value[a] = {}
  if (!state.matchHistory.value[b]) state.matchHistory.value[b] = {}
  if (!state.lastMatchIndex.value[a]) state.lastMatchIndex.value[a] = {}
  if (!state.lastMatchIndex.value[b]) state.lastMatchIndex.value[b] = {}
}

function allMatchups(teams: string[]): [string, string][] {
  const res: [string, string][] = []
  const list = teams ?? []
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

export function resetMatchHistoryIfBalanced(state: PairingState, teams: string[]) {
  // Если баланс уже “сошёлся”, сбрасываем круг пар (историю встреч).
  if (teams.length < 3) return
  const matchups = allMatchups(teams)
  if (matchups.length === 0) return

  let minMatchesPlayed = Infinity
  for (const [a, b] of matchups) {
    const count = state.matchHistory.value?.[a]?.[b] ?? 0
    minMatchesPlayed = Math.min(minMatchesPlayed, count)
  }

  const shouldReset = matchups.every(([a, b]) => (state.matchHistory.value?.[a]?.[b] ?? 0) >= minMatchesPlayed + 1)
  if (shouldReset) {
    state.matchHistory.value = {}
    state.lastMatchIndex.value = {}
  }
}

export function pickNextMatchPair(
  state: PairingState,
  teams: string[],
): { home: string; away: string } | null {
  // Подбираем следующую пару по эвристике (отдых/дистанция до последней встречи/частота).
  if (teams.length < 2) return null

  if (teams.length === 2) {
    if (state.playedSingleMatch.value) return null
    const home = teams[0]
    const away = teams[1]
    if (!home || !away) return null
    return { home, away }
  }

  const totalMatches = state.matchCount.value
  for (const t of teams) ensureTeam(state, t)

  const teamGamesCountValues = teams.map((t) => state.teamGamesCount.value[t] ?? 0)
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

  const matchups = allMatchups(teams)
  for (const [a, b] of matchups) {
    const consecA = state.consecutiveGames.value[a] ?? 0
    const consecB = state.consecutiveGames.value[b] ?? 0
    if (consecA >= 2 || consecB >= 2) continue

    let score = 0

    // Чем дальше от последней встречи, тем лучше.
    const last = state.lastMatchIndex.value?.[a]?.[b]
    if (last !== undefined && last !== null) {
      const distanceFromLastMatch = totalMatches - last
      score += distanceFromLastMatch * 2000
    } else {
      score += 100000
    }

    // Пенальти за то, сколько раз эта пара уже играла (после последнего сброса).
    const gamesPlayed = state.matchHistory.value?.[a]?.[b] ?? 0
    score -= gamesPlayed * 100

    const iGames = state.teamGamesCount.value[a] ?? 0
    const jGames = state.teamGamesCount.value[b] ?? 0
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
    if (state.consecutiveGames.value[a] === 0 && iRests >= avgRests) score += 10
    if (state.consecutiveGames.value[b] === 0 && jRests >= avgRests) score += 10

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

export function recordFinishedMatch(
  state: PairingState,
  home: string,
  away: string,
  teams: string[],
): number {
  // Фиксируем завершённый матч: обновляем счётчики и историю пар.
  ensureTeam(state, home)
  ensureTeam(state, away)
  ensurePair(state, home, away)

  state.matchCount.value += 1
  const matchNumber = state.matchCount.value

  state.teamGamesCount.value[home] = (state.teamGamesCount.value[home] ?? 0) + 1
  state.teamGamesCount.value[away] = (state.teamGamesCount.value[away] ?? 0) + 1

  state.consecutiveGames.value[home] = (state.consecutiveGames.value[home] ?? 0) + 1
  state.consecutiveGames.value[away] = (state.consecutiveGames.value[away] ?? 0) + 1

  // Остальные команды "отдыхали" в этот матч.
  for (const t of teams ?? []) {
    if (t !== home && t !== away) state.consecutiveGames.value[t] = 0
  }

  // Обновляем историю пары (симметрично).
  const mhHome = state.matchHistory.value[home] ?? {}
  const mhAway = state.matchHistory.value[away] ?? {}
  state.matchHistory.value[home] = mhHome
  state.matchHistory.value[away] = mhAway
  state.matchHistory.value[home][away] = (state.matchHistory.value[home][away] ?? 0) + 1
  state.matchHistory.value[away][home] = (state.matchHistory.value[away][home] ?? 0) + 1

  // Обновляем lastMatchIndex (номер матча).
  const lmiHome = state.lastMatchIndex.value[home] ?? {}
  const lmiAway = state.lastMatchIndex.value[away] ?? {}
  state.lastMatchIndex.value[home] = lmiHome
  state.lastMatchIndex.value[away] = lmiAway
  state.lastMatchIndex.value[home][away] = matchNumber
  state.lastMatchIndex.value[away][home] = matchNumber

  // Если команд всего 2 — дальше матчей нет.
  if ((teams ?? []).length === 2) {
    state.playedSingleMatch.value = true
  }

  return matchNumber
}

