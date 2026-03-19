// Этот файл: функции для обновления и сортировки standings (таблицы).
// Он учитывает очки, голы и разницу мячей, чтобы UI показывал корректный порядок.
import type { Ref } from 'vue'
import type { StandingsRow } from '~/components/organisms/standings/Table.vue'

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

export function resortStandings(standingsRows: Ref<StandingsRow[]>) {
  // Пересчитываем места по правилам: очки -> разница -> голы -> имя команды.
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

