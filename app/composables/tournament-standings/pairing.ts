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

// Откатываем запись о матче из pairingState при его удалении.
// Восстанавливаем счётчики так, чтобы "следующий матч" продолжал работать корректно.
export function unrecordFinishedMatch(
  state: PairingState,
  home: string,
  away: string,
  matchNumber: number,
  teams: string[],
  allRemainingMatches: { homeTeam: string; awayTeam: string; matchNumber: number }[],
) {
  // Уменьшаем общий счётчик матчей.
  state.matchCount.value = Math.max(0, state.matchCount.value - 1)

  // Уменьшаем счётчики игр команд.
  if (state.teamGamesCount.value[home] !== undefined)
    state.teamGamesCount.value[home] = Math.max(0, state.teamGamesCount.value[home] - 1)
  if (state.teamGamesCount.value[away] !== undefined)
    state.teamGamesCount.value[away] = Math.max(0, state.teamGamesCount.value[away] - 1)

  // Пересчитываем matchHistory и lastMatchIndex по оставшимся матчам с нуля.
  // Это самый надёжный способ — гарантирует корректное состояние после любого удаления.
  const newHistory: Record<string, Record<string, number>> = {}
  const newLastMatchIndex: Record<string, Record<string, number>> = {}

  for (const m of allRemainingMatches) {
    const h = m.homeTeam
    const a = m.awayTeam
    const mn = m.matchNumber

    if (!newHistory[h]) newHistory[h] = {}
    if (!newHistory[a]) newHistory[a] = {}
    newHistory[h][a] = (newHistory[h][a] ?? 0) + 1
    newHistory[a][h] = (newHistory[a][h] ?? 0) + 1

    if (!newLastMatchIndex[h]) newLastMatchIndex[h] = {}
    if (!newLastMatchIndex[a]) newLastMatchIndex[a] = {}
    newLastMatchIndex[h][a] = mn
    newLastMatchIndex[a][h] = mn
  }

  state.matchHistory.value = newHistory
  state.lastMatchIndex.value = newLastMatchIndex

  // Пересчитываем consecutiveGames — сколько матчей подряд сыграла каждая команда
  // в конце текущей последовательности (считаем с конца оставшегося списка).
  const newConsecutive: Record<string, number> = {}
  for (const t of teams) newConsecutive[t] = 0

  // Идём с конца оставшихся матчей и считаем непрерывную серию для каждой команды.
  const sorted = [...allRemainingMatches].sort((a, b) => a.matchNumber - b.matchNumber)
  for (let i = sorted.length - 1; i >= 0; i--) {
    const m = sorted[i]
    const playedTeams = new Set([m.homeTeam, m.awayTeam])
    // Если команда уже получила ненулевую серию — её серия прервана остальными.
    let anyBroke = false
    for (const t of teams) {
      if (!playedTeams.has(t) && newConsecutive[t] !== undefined && newConsecutive[t] > 0) {
        // Команда отдыхала в этом матче — серия должна была прерваться.
        anyBroke = true
      }
    }
    if (anyBroke) break
    for (const t of [m.homeTeam, m.awayTeam]) {
      newConsecutive[t] = (newConsecutive[t] ?? 0) + 1
    }
  }
  state.consecutiveGames.value = newConsecutive

  // Для 2 команд: если матчей не осталось — сбрасываем флаг, чтобы можно было сыграть снова.
  if (teams.length === 2) {
    state.playedSingleMatch.value = allRemainingMatches.length > 0
  }
}

// Полная пересинхронизация состояния подбора пар по реальному списку матчей.
// Вызывается перед pickNextMatchPair чтобы гарантировать корректность счётчиков —
// даже если матчи были записаны/удалены "вручную" или не через goToNextMatch.
export function recalibratePairingState(
  state: PairingState,
  teams: string[],
  allMatches: { homeTeam: string; awayTeam: string; matchNumber: number }[],
) {
  // Сортируем матчи по номеру — источник правды для всех счётчиков.
  const sorted = [...allMatches].sort((a, b) => a.matchNumber - b.matchNumber)

  // Пересчитываем matchCount по максимальному matchNumber (не по длине, т.к. могут быть дырки).
  state.matchCount.value = sorted.length > 0
    ? Math.max(...sorted.map((m) => m.matchNumber))
    : 0

  // Пересчитываем teamGamesCount — сколько раз каждая команда сыграла.
  const newGamesCount: Record<string, number> = {}
  for (const t of teams) newGamesCount[t] = 0
  for (const m of sorted) {
    newGamesCount[m.homeTeam] = (newGamesCount[m.homeTeam] ?? 0) + 1
    newGamesCount[m.awayTeam] = (newGamesCount[m.awayTeam] ?? 0) + 1
  }
  state.teamGamesCount.value = newGamesCount

  // Пересчитываем matchHistory и lastMatchIndex по всем матчам с нуля.
  const newHistory: Record<string, Record<string, number>> = {}
  const newLastMatchIndex: Record<string, Record<string, number>> = {}
  for (const m of sorted) {
    const h = m.homeTeam
    const a = m.awayTeam
    const mn = m.matchNumber
    if (!newHistory[h]) newHistory[h] = {}
    if (!newHistory[a]) newHistory[a] = {}
    newHistory[h][a] = (newHistory[h][a] ?? 0) + 1
    newHistory[a][h] = (newHistory[a][h] ?? 0) + 1
    if (!newLastMatchIndex[h]) newLastMatchIndex[h] = {}
    if (!newLastMatchIndex[a]) newLastMatchIndex[a] = {}
    newLastMatchIndex[h][a] = mn
    newLastMatchIndex[a][h] = mn
  }
  state.matchHistory.value = newHistory
  state.lastMatchIndex.value = newLastMatchIndex

  // Пересчитываем consecutiveGames — непрерывная серия с конца для каждой команды.
  // Идём с конца отсортированного списка и считаем, пока серия не прерывается.
  const newConsecutive: Record<string, number> = {}
  for (const t of teams) newConsecutive[t] = 0
  for (let i = sorted.length - 1; i >= 0; i--) {
    const m = sorted[i]
    const playedTeams = new Set([m.homeTeam, m.awayTeam])
    // Если какая-то команда уже имеет серию, но не играла в этом матче — серия прервана.
    let anyBroke = false
    for (const t of teams) {
      if (!playedTeams.has(t) && (newConsecutive[t] ?? 0) > 0) {
        anyBroke = true
        break
      }
    }
    if (anyBroke) break
    for (const t of [m.homeTeam, m.awayTeam]) {
      newConsecutive[t] = (newConsecutive[t] ?? 0) + 1
    }
  }
  state.consecutiveGames.value = newConsecutive

  // Для 2 команд: флаг "сыграли единственный матч" — true если хотя бы один матч есть.
  if (teams.length === 2) {
    state.playedSingleMatch.value = sorted.length > 0
  }
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

