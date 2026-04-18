// Этот файл: функции для обновления и сортировки standings (таблицы).
// Очки → личные встречи → общая разница → забитые → имя команды.
import type { Ref } from 'vue'
import type { StandingsRow } from '~/components/organisms/standings/Table.vue'
import type { PlayedMatch } from '~/composables/tournament-standings/types'

export function updateStandingsForTeam(
  standingsRows: Ref<StandingsRow[]>,
  teamName: string,
  goalsFor: number,
  goalsAgainst: number,
) {
  // Находим строку команды и добавляем ей результат матча (очки/голы/победы).
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

// Очки и голы только в матчах пары teamA vs teamB (все очные встречи).
function aggregateHeadToHeadPair(
  teamA: string,
  teamB: string,
  matches: readonly PlayedMatch[],
): { ptsA: number; ptsB: number; gfA: number; gfB: number } {
  let ptsA = 0
  let ptsB = 0
  let gfA = 0
  let gfB = 0
  for (const m of matches) {
    if (m.homeTeam === teamA && m.awayTeam === teamB) {
      gfA += m.homeGoals
      gfB += m.awayGoals
      if (m.homeGoals > m.awayGoals) ptsA += 3
      else if (m.homeGoals < m.awayGoals) ptsB += 3
      else {
        ptsA += 1
        ptsB += 1
      }
    } else if (m.homeTeam === teamB && m.awayTeam === teamA) {
      gfB += m.homeGoals
      gfA += m.awayGoals
      if (m.homeGoals > m.awayGoals) ptsB += 3
      else if (m.homeGoals < m.awayGoals) ptsA += 3
      else {
        ptsA += 1
        ptsB += 1
      }
    }
  }
  return { ptsA, ptsB, gfA, gfB }
}

// Лички в смысле Array.sort: отрицательное — a выше b.
function compareHeadToHeadRows(a: StandingsRow, b: StandingsRow, matches: readonly PlayedMatch[]): number {
  const { ptsA, ptsB, gfA, gfB } = aggregateHeadToHeadPair(a.teamName, b.teamName, matches)
  if (ptsA !== ptsB) return ptsB - ptsA
  const miniDiff = gfA - gfB
  if (miniDiff !== 0) return gfB - gfA
  if (gfA !== gfB) return gfB - gfA
  return 0
}

export function resortStandings(
  standingsRows: Ref<StandingsRow[]>,
  playedMatchesList?: readonly PlayedMatch[],
) {
  const matches = playedMatchesList ?? []
  standingsRows.value = [...standingsRows.value]
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (matches.length > 0) {
        const h2h = compareHeadToHeadRows(a, b, matches)
        if (h2h !== 0) return h2h
      }
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
      return a.teamName.localeCompare(b.teamName)
    })
    .map((row, index) => ({
      ...row,
      place: index + 1,
    }))
}
