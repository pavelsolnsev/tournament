import type { StandingsRow } from '~/components/organisms/standings/Table.vue'
import type { PlayedMatch } from './types'

/** Simple10: Убирает один сыгранный матч из очков/голов строк таблицы (перед правкой или удалением записи). */
export function subtractPlayedMatchFromStandingsRows(
  rows: StandingsRow[],
  old: Pick<PlayedMatch, 'homeTeam' | 'awayTeam' | 'homeGoals' | 'awayGoals'>,
): void {
  const homeRow = rows.find((r) => r.teamName === old.homeTeam)
  const awayRow = rows.find((r) => r.teamName === old.awayTeam)
  if (!homeRow || !awayRow) return

  homeRow.played -= 1
  homeRow.goalsFor -= old.homeGoals
  homeRow.goalsAgainst -= old.awayGoals
  awayRow.played -= 1
  awayRow.goalsFor -= old.awayGoals
  awayRow.goalsAgainst -= old.homeGoals

  if (old.homeGoals > old.awayGoals) {
    homeRow.wins -= 1
    homeRow.points -= 3
  }
  else if (old.homeGoals < old.awayGoals) {
    homeRow.losses -= 1
  }
  else {
    homeRow.draws -= 1
    homeRow.points -= 1
  }

  if (old.awayGoals > old.homeGoals) {
    awayRow.wins -= 1
    awayRow.points -= 3
  }
  else if (old.awayGoals < old.homeGoals) {
    awayRow.losses -= 1
  }
  else {
    awayRow.draws -= 1
    awayRow.points -= 1
  }

  homeRow.goalDiff = homeRow.goalsFor - homeRow.goalsAgainst
  awayRow.goalDiff = awayRow.goalsFor - awayRow.goalsAgainst
}
