// Прогноз расписания: кто играет сейчас, следующим и дальше.
// Пара выбирается по тем же правилам, что и кнопка «Следующий матч» (отдых, давность встречи,
// баланс игр) — счёт на выбор не влияет, поэтому порядок можно просчитать заранее.
// Если судья выберет пару вручную, прогноз просто пересчитается от фактически сыгранных матчей.
import type { Ref } from 'vue'
import type { PairingState } from './pairing'
import { orientForHomeBalance, pickNextMatchPair, recalibratePairingState, resetMatchHistoryIfBalanced } from './pairing'
import { plannedMatchesTotal } from './plannedMatches'

export type ScheduledMatch = {
  /** Номер матча в турнире (1, 2, …). */
  number: number
  home: string
  away: string
  /** true — этот матч идёт сейчас. */
  isCurrent: boolean
}

type PlayedRef = { homeTeam: string; awayTeam: string; matchNumber: number }

/** Без плана (необычное число команд) показываем столько матчей вперёд. */
const FALLBACK_AHEAD = 6

function freshPairingState(): PairingState {
  const r = <T>(value: T) => ({ value }) as Ref<T>
  return {
    matchCount: r(0),
    teamGamesCount: r({}),
    consecutiveGames: r({}),
    matchHistory: r({}),
    lastMatchIndex: r({}),
    playedSingleMatch: r(false),
  }
}

/**
 * @param current — пара текущего матча, если он идёт и ещё не записан в сыгранные.
 * Возвращает текущий матч (если есть) и все следующие до конца плана (4 команды — 18, 3 — 12).
 */
export function forecastSchedule(opts: {
  teams: string[]
  played: PlayedRef[]
  current: { home: string; away: string } | null
}): ScheduledMatch[] {
  const teams = opts.teams.filter(Boolean)
  if (teams.length < 2) return []

  const timeline: PlayedRef[] = [...opts.played]
  const total = plannedMatchesTotal(teams.length)
  // Сколько матчей ещё впереди (вместе с текущим).
  const remaining = total != null ? Math.max(0, total - timeline.length) : FALLBACK_AHEAD
  const nextNumber = () => (timeline.length ? Math.max(...timeline.map((m) => m.matchNumber)) : 0) + 1

  const out: ScheduledMatch[] = []
  if (opts.current?.home && opts.current?.away && remaining > 0) {
    const number = nextNumber()
    out.push({ number, home: opts.current.home, away: opts.current.away, isCurrent: true })
    timeline.push({ homeTeam: opts.current.home, awayTeam: opts.current.away, matchNumber: number })
  }

  while (out.length < remaining) {
    // Ровно как advanceToNextPair: пересчёт по сыгранным → сброс круга, если сошёлся → выбор пары.
    const state = freshPairingState()
    recalibratePairingState(state, teams, timeline)
    resetMatchHistoryIfBalanced(state, teams)
    const picked = pickNextMatchPair(state, teams)
    if (!picked) break
    const next = orientForHomeBalance(picked, timeline)
    const number = nextNumber()
    out.push({ number, home: next.home, away: next.away, isCurrent: false })
    timeline.push({ homeTeam: next.home, awayTeam: next.away, matchNumber: number })
  }
  return out
}
