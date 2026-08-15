// Этот файл: полное удаление команды из снапшота таблицы.
// Вместе со строкой команды убираем её матчи, статистику игроков и рейтинговые дельты —
// иначе удалённая команда продолжает жить в сохранённом снапшоте и снова видна в таблице.
import { shallowRef } from 'vue'
import type { Player } from '~/types/tournament'
import type { StandingsRow } from '~/components/organisms/standings/Table.vue'
import type { SavedStandingsSnapshot } from '~/composables/tournament-wizard/savedContextTypes'
import { normalizeTeamName } from '~/utils/teamNames'
import type { PairingState } from './pairing'
import { recalibratePairingState } from './pairing'
import type { PlayedMatch } from './types'
import { subtractPlayedMatchFromStandingsRows } from './subtractPlayedMatchFromStandingsRows'
import { subtractMatchFromAggregate } from './aggregateTournamentPlayerStats'
import { computeTeamRatingDeltas, revertRatingDeltas } from './ratings'
import { resortStandings } from './standings'

/**
 * Simple10: Вычищает команду из снапшота «под ноль» — строку, её матчи и всё, что эти матчи начислили.
 * Возвращает новый объект, исходный снапшот не меняется.
 */
export function pruneTeamFromStandingsSnapshot(args: {
  snapshot: SavedStandingsSnapshot | null
  teamName: string
  playersById: Record<number, Player>
}): SavedStandingsSnapshot | null {
  const { snapshot, teamName, playersById } = args
  const normalized = normalizeTeamName(teamName)
  if (!snapshot || !normalized) return snapshot

  // Работаем на глубокой копии — снапшот может прийти readonly-прокси из API.
  const next: SavedStandingsSnapshot = JSON.parse(JSON.stringify(snapshot))
  const isTarget = (name: string) => normalizeTeamName(name ?? '') === normalized

  // Делим сыгранные матчи на удаляемые (с участием команды) и остающиеся.
  const removed: PlayedMatch[] = []
  const kept: PlayedMatch[] = []
  for (const m of next.playedMatchesList ?? []) {
    if (isTarget(m.homeTeam) || isTarget(m.awayTeam)) removed.push(m)
    else kept.push(m)
  }

  // Дельты рейтинга держим в ref — этого требуют готовые хелперы отката.
  const ratingDeltas = shallowRef<Record<number, number>>({ ...(next.playerRatingDeltas ?? {}) })

  // Каждый удаляемый матч откатываем целиком: очки и голы соперника, события игроков, рейтинг.
  // Вычитаем до удаления строки команды — хелпер работает, только пока обе строки на месте.
  for (const m of removed) {
    subtractPlayedMatchFromStandingsRows(next.standingsRows ?? [], m)

    next.aggregatePlayerStats = subtractMatchFromAggregate(
      next.aggregatePlayerStats ?? {},
      m.homeStats ?? {},
      m.awayStats ?? {},
    )

    const isDraw = m.homeGoals === m.awayGoals
    const isHomeWin = m.homeGoals > m.awayGoals
    const homeDeltas = computeTeamRatingDeltas({
      playersById,
      statsRecord: m.homeStats ?? {},
      isWin: isHomeWin,
      isDraw,
      isLose: !isHomeWin && !isDraw,
      teamGoals: m.homeGoals,
      opponentGoals: m.awayGoals,
    })
    const awayDeltas = computeTeamRatingDeltas({
      playersById,
      statsRecord: m.awayStats ?? {},
      isWin: !isHomeWin && !isDraw,
      isDraw,
      isLose: isHomeWin,
      teamGoals: m.awayGoals,
      opponentGoals: m.homeGoals,
    })
    revertRatingDeltas({
      playerRatingDeltas: ratingDeltas,
      deltas: { ...homeDeltas, ...awayDeltas },
    })
  }
  next.playerRatingDeltas = ratingDeltas.value

  // Оставшиеся матчи нумеруем подряд — в списке не должно быть дырок.
  next.playedMatchesList = kept.map((m, i) => ({ ...m, matchNumber: i + 1 }))

  // Убираем саму строку команды и пересортировываем таблицу с учётом личных встреч.
  const rowsRef = shallowRef<StandingsRow[]>(
    (next.standingsRows ?? []).filter((r) => !isTarget(r.teamName)),
  )
  resortStandings(rowsRef, next.playedMatchesList)
  next.standingsRows = rowsRef.value

  // Счётчики подбора пар пересобираем с нуля по оставшимся командам и матчам —
  // так из них гарантированно уходят ключи удалённой команды.
  const remainingTeams = next.standingsRows.map((r) => r.teamName)
  const pairing: PairingState = {
    matchCount: shallowRef(next.matchCount ?? 0),
    teamGamesCount: shallowRef({ ...(next.teamGamesCount ?? {}) }),
    consecutiveGames: shallowRef({ ...(next.consecutiveGames ?? {}) }),
    matchHistory: shallowRef({ ...(next.matchHistory ?? {}) }),
    lastMatchIndex: shallowRef({ ...(next.lastMatchIndex ?? {}) }),
    playedSingleMatch: shallowRef(next.playedSingleMatch ?? false),
  }
  recalibratePairingState(pairing, remainingTeams, next.playedMatchesList)
  next.matchCount = pairing.matchCount.value
  next.teamGamesCount = pairing.teamGamesCount.value
  next.consecutiveGames = pairing.consecutiveGames.value
  next.matchHistory = pairing.matchHistory.value
  next.lastMatchIndex = pairing.lastMatchIndex.value
  next.playedSingleMatch = pairing.playedSingleMatch.value

  // Текущий незавершённый матч с этой командой играть уже некому — сбрасываем его.
  // Пустые названия команд заодно отключают серверный мёрж живых отметок.
  if (isTarget(next.currentHomeTeam ?? '') || isTarget(next.currentAwayTeam ?? '')) {
    next.currentHomeTeam = ''
    next.currentAwayTeam = ''
    next.currentHomeStats = {}
    next.currentAwayStats = {}
    next.currentStatsSeq = (next.currentStatsSeq ?? 0) + 1
  }

  return next
}
