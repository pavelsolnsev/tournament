import type { Ref } from 'vue'
import type { PlayedMatch } from './types'
import type { StandingsRow } from '~/components/organisms/standings/Table.vue'
import { recordFinishedMatch, resetMatchHistoryIfBalanced } from './pairing'
import type { PairingState } from './pairing'
import { resortStandings, updateStandingsForTeam } from './standings'

/** Счёт технического результата: победитель 3, проигравший 0. */
const TECHNICAL_DEFEAT_GOALS = 3

/**
 * Технический результат для текущей пары: выбранная команда получает поражение 3:0,
 * соперник — победу 3:0. Идёт только в таблицу (очки/голы команд); игрокам ничего
 * не начисляется — составы и статистика матча пустые, поэтому голы/ассисты/рейтинг не меняются.
 */
export function recordTechnicalDefeat(args: {
  homeTeam: Ref<string>
  awayTeam: Ref<string>
  /** Команда-нарушитель (одна из двух в паре), которой засчитывается поражение. */
  losingTeam: string
  standingsRows: Ref<StandingsRow[]>
  playedMatchesList: Ref<PlayedMatch[]>
  pairingState: PairingState
  teams: string[]
  resetMatchStats: () => void
}) {
  const { homeTeam, awayTeam, losingTeam, standingsRows, playedMatchesList, pairingState, teams, resetMatchStats } = args
  const home = homeTeam.value
  const away = awayTeam.value
  if (!home || !away) return

  // Определяем, кто из двух команд получает поражение — по выбору админа.
  const homeLoses = home === losingTeam
  const awayLoses = away === losingTeam
  if (!homeLoses && !awayLoses) return

  // Счёт: проигравшая команда 0, победитель 3.
  const hg = homeLoses ? 0 : TECHNICAL_DEFEAT_GOALS
  const ag = homeLoses ? TECHNICAL_DEFEAT_GOALS : 0

  // Таблица: победитель +3 очка и +3 гола, проигравший — поражение и −3 гола.
  updateStandingsForTeam(standingsRows, home, hg, ag)
  updateStandingsForTeam(standingsRows, away, ag, hg)

  // Номер матча и балансировка истории пар — как у обычного сыгранного матча.
  const matchNumber = recordFinishedMatch(pairingState, home, away, teams)
  resetMatchHistoryIfBalanced(pairingState, teams)

  // Матч без событий: составы и статистика пустые — голы никому не отмечаются.
  playedMatchesList.value.push({
    matchNumber,
    homeTeam: home,
    awayTeam: away,
    homeGoals: hg,
    awayGoals: ag,
    homePlayers: [],
    awayPlayers: [],
    homeStats: {},
    awayStats: {},
  })

  // Пересортировываем таблицу и очищаем текущий матч (составы, отметки, флаг финализации).
  resortStandings(standingsRows, playedMatchesList.value)
  resetMatchStats()
  homeTeam.value = ''
  awayTeam.value = ''
}
